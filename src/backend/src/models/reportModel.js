const pool = require('../db/pool');

// Assembles a full report object matching the legacy DynamoDB shape
// so all services/routes work without any changes
async function buildReport(client, row) {
  if (!row) return null;

  const [imagesRes, timelineRes, upvotesRes, verificationsRes] = await Promise.all([
    client.query(
      `SELECT image_url, image_key, is_proof FROM report_images WHERE report_id = $1 ORDER BY uploaded_at`,
      [row.id]
    ),
    client.query(
      `SELECT status, note, updated_by, created_at FROM report_timeline WHERE report_id = $1 ORDER BY created_at`,
      [row.id]
    ),
    client.query(
      `SELECT user_id, created_at FROM report_upvotes WHERE report_id = $1 ORDER BY created_at`,
      [row.id]
    ),
    client.query(
      `SELECT user_id, action, created_at FROM report_verifications WHERE report_id = $1 ORDER BY created_at`,
      [row.id]
    )
  ]);

  const images = imagesRes.rows.filter(r => !r.is_proof).map(r => r.image_url);
  const imageKeys = imagesRes.rows.filter(r => !r.is_proof).map(r => r.image_key);
  const completionImages = imagesRes.rows.filter(r => r.is_proof).map(r => r.image_url);

  const timeline = timelineRes.rows.map(t => ({
    status:    t.status,
    timestamp: t.created_at,
    by:        t.updated_by,
    notes:     t.note,
    proofImages: completionImages.length > 0 && t.status === 'Work Over' ? completionImages : undefined
  }));

  const upvotes = upvotesRes.rows.map(u => ({
    userId:    u.user_id,
    timestamp: u.created_at
  }));

  const verifications = verificationsRes.rows.map(v => ({
    userId:    v.user_id,
    verified:  v.action === 'verify',
    timestamp: v.created_at
  }));

  return {
    reportId:             row.id,
    userId:               row.user_id,
    title:                row.title,
    description:          row.description,
    type:                 row.type,
    category:             row.category,
    seriousness:          row.seriousness,
    priority:             parseFloat(row.priority_score),
    latitude:             parseFloat(row.latitude),
    longitude:            parseFloat(row.longitude),
    status:               row.status,
    noticedTime:          row.noticed_time,
    awaitingVerification: row.awaiting_verification,
    completedAt:          row.completed_at,
    createdAt:            row.created_at,
    images,
    imageKeys,
    completionImages,
    timeline,
    upvotes,
    verifications
  };
}

class ReportModel {
  async createReport(report) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO reports
           (id, user_id, title, description, type, category, seriousness,
            priority_score, latitude, longitude, status, noticed_time)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          report.reportId,
          report.userId,
          report.title || null,
          report.description,
          report.type,
          report.category,
          report.seriousness || 'medium',
          report.priority || 0,
          report.latitude,
          report.longitude,
          report.status || 'Reported',
          report.noticedTime || null
        ]
      );

      // Insert images
      if (report.images && report.images.length > 0) {
        for (let i = 0; i < report.images.length; i++) {
          await client.query(
            `INSERT INTO report_images (report_id, image_url, image_key, is_proof)
             VALUES ($1, $2, $3, false)`,
            [rows[0].id, report.images[i], report.imageKeys?.[i] || null]
          );
        }
      }

      // Insert initial timeline entry
      if (report.timeline && report.timeline.length > 0) {
        const t = report.timeline[0];
        await client.query(
          `INSERT INTO report_timeline (report_id, status, updated_by)
           VALUES ($1, $2, $3)`,
          [rows[0].id, t.status, t.by]
        );
      }

      await client.query('COMMIT');
      return await buildReport(client, rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getReportById(reportId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`SELECT * FROM reports WHERE id = $1`, [reportId]);
      return await buildReport(client, rows[0]);
    } finally {
      client.release();
    }
  }

  async getReportsByUserId(userId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return await Promise.all(rows.map(r => buildReport(client, r)));
    } finally {
      client.release();
    }
  }

  async getAllReports() {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`SELECT * FROM reports ORDER BY created_at DESC`);
      return await Promise.all(rows.map(r => buildReport(client, r)));
    } finally {
      client.release();
    }
  }

  async updateReport(reportId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Handle timeline append
      if (updates.timeline) {
        const lastEntry = updates.timeline[updates.timeline.length - 1];
        await client.query(
          `INSERT INTO report_timeline (report_id, status, note, updated_by)
           VALUES ($1, $2, $3, $4)`,
          [reportId, lastEntry.status, lastEntry.notes || null, lastEntry.by || null]
        );
      }

      // Handle proof images (completionImages)
      if (updates.completionImages && updates.completionImages.length > 0) {
        for (const url of updates.completionImages) {
          await client.query(
            `INSERT INTO report_images (report_id, image_url, is_proof) VALUES ($1, $2, true)
             ON CONFLICT DO NOTHING`,
            [reportId, url]
          );
        }
      }

      // Handle upvotes array
      if (updates.upvotes) {
        const lastUpvote = updates.upvotes[updates.upvotes.length - 1];
        if (lastUpvote) {
          await client.query(
            `INSERT INTO report_upvotes (report_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [reportId, lastUpvote.userId]
          );
        }
      }

      // Handle verifications array
      if (updates.verifications) {
        const lastVerif = updates.verifications[updates.verifications.length - 1];
        if (lastVerif) {
          await client.query(
            `INSERT INTO report_verifications (report_id, user_id, action)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [reportId, lastVerif.userId, lastVerif.verified ? 'verify' : 'reject']
          );
        }
      }

      // Map scalar field updates to columns
      const fieldMap = {
        status:               'status',
        priority:             'priority_score',
        awaitingVerification: 'awaiting_verification',
        completedAt:          'completed_at'
      };

      const setClauses = ['updated_at = NOW()'];
      const values = [];
      let idx = 1;

      for (const [key, col] of Object.entries(fieldMap)) {
        if (updates[key] !== undefined) {
          setClauses.push(`${col} = $${idx++}`);
          values.push(updates[key]);
        }
      }

      values.push(reportId);
      const { rows } = await client.query(
        `UPDATE reports SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );

      await client.query('COMMIT');
      return await buildReport(client, rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteReport(reportId) {
    await pool.query(`DELETE FROM reports WHERE id = $1`, [reportId]);
  }
}

module.exports = new ReportModel();
