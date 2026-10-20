const pool = require('../db/pool');

// Maps DB row → legacy shape expected by services/routes
function mapUser(row) {
  if (!row) return null;
  return {
    userId:    row.id,
    name:      row.name,
    email:     row.email,
    phone:     row.phone,
    address:   row.address,
    password:  row.password_hash,
    role:      row.role,
    department:row.department,
    verified:  row.verified,
    karma:     row.karma,
    otp:       row.otp_code   || null,
    otpExpiry: row.otp_expiry || null,
    createdAt: row.created_at
  };
}

class UserModel {
  async createUser(user) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO users (id, name, email, phone, address, password_hash, role, verified, karma)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          user.userId,
          user.name,
          user.email,
          user.phone || null,
          user.address || null,
          user.password,
          user.role || 'user',
          user.verified || false,
          user.karma || 0
        ]
      );

      // Store OTP if provided
      if (user.otp) {
        await client.query(
          `INSERT INTO otp_verifications (user_id, otp_code, expires_at)
           VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
          [rows[0].id, user.otp, user.otpExpiry]
        );
      }

      await client.query('COMMIT');
      return mapUser(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserById(userId) {
    const { rows } = await pool.query(
      `SELECT u.*,
              ov.otp_code,
              EXTRACT(EPOCH FROM ov.expires_at) * 1000 AS otp_expiry
       FROM users u
       LEFT JOIN otp_verifications ov
         ON ov.user_id = u.id AND ov.verified = false
         AND ov.expires_at > NOW()
       WHERE u.id = $1
       ORDER BY ov.created_at DESC
       LIMIT 1`,
      [userId]
    );
    return mapUser(rows[0]);
  }

  async getUserByEmail(email) {
    const { rows } = await pool.query(
      `SELECT u.*,
              ov.otp_code,
              EXTRACT(EPOCH FROM ov.expires_at) * 1000 AS otp_expiry
       FROM users u
       LEFT JOIN otp_verifications ov
         ON ov.user_id = u.id AND ov.verified = false
         AND ov.expires_at > NOW()
       WHERE u.email = $1
       ORDER BY ov.created_at DESC
       LIMIT 1`,
      [email]
    );
    return mapUser(rows[0]);
  }

  async updateUser(userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Handle OTP fields separately
      if (updates.otp !== undefined) {
        if (updates.otp === null) {
          // Mark all pending OTPs as verified
          await client.query(
            `UPDATE otp_verifications SET verified = true WHERE user_id = $1`,
            [userId]
          );
        } else {
          await client.query(
            `INSERT INTO otp_verifications (user_id, otp_code, expires_at)
             VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
            [userId, updates.otp, updates.otpExpiry]
          );
        }
        delete updates.otp;
        delete updates.otpExpiry;
      }

      // Map legacy field names to column names
      const fieldMap = {
        name:     'name',
        phone:    'phone',
        address:  'address',
        verified: 'verified',
        karma:    'karma',
        password: 'password_hash'
      };

      const setClauses = [];
      const values = [];
      let idx = 1;

      for (const [key, col] of Object.entries(fieldMap)) {
        if (updates[key] !== undefined) {
          setClauses.push(`${col} = $${idx++}`);
          values.push(updates[key]);
        }
      }

      let row;
      if (setClauses.length > 0) {
        values.push(userId);
        const { rows } = await client.query(
          `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
          values
        );
        row = rows[0];
      } else {
        const { rows } = await client.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        row = rows[0];
      }

      await client.query('COMMIT');
      return mapUser(row);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateUserKarma(userId, karma) {
    return await this.updateUser(userId, { karma });
  }

  async getAllUsers() {
    const { rows } = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return rows.map(mapUser);
  }

  async deleteUser(userId) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }
}

module.exports = new UserModel();
