const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function mapAuthority(row) {
  if (!row) return null;
  return {
    authorityId: row.id,
    username:    row.username,
    password:    row.password_hash,
    name:        row.name,
    department:  row.department,
    location:    row.location,
    createdAt:   row.created_at
  };
}

class AuthorityModel {
  async createAuthority(authority) {
    const hash = await bcrypt.hash(authority.password, 10);
    const id = authority.authorityId || uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO authorities (id, username, password_hash, name, department, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, authority.username, hash, authority.name || null, authority.department, authority.location || null]
    );
    return mapAuthority(rows[0]);
  }

  async getAuthorityById(authorityId) {
    const { rows } = await pool.query(`SELECT * FROM authorities WHERE id = $1`, [authorityId]);
    return mapAuthority(rows[0]);
  }

  async getAuthorityByUsername(username) {
    const { rows } = await pool.query(`SELECT * FROM authorities WHERE username = $1`, [username]);
    return mapAuthority(rows[0]);
  }

  async getAllAuthorities() {
    const { rows } = await pool.query(`SELECT * FROM authorities ORDER BY created_at`);
    return rows.map(mapAuthority);
  }

  async updateAuthority(authorityId, updates) {
    const fieldMap = { name: 'name', department: 'department', location: 'location' };
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) return this.getAuthorityById(authorityId);

    values.push(authorityId);
    const { rows } = await pool.query(
      `UPDATE authorities SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return mapAuthority(rows[0]);
  }

  async initializeDefaults() {
    const defaults = [
      { username: 'authority1', password: 'auth123', department: 'roads',       location: 'Tamil Nadu', name: 'Roads Authority' },
      { username: 'authority2', password: 'auth123', department: 'water',       location: 'Tamil Nadu', name: 'Water Authority' },
      { username: 'authority3', password: 'auth123', department: 'sanitation',  location: 'Tamil Nadu', name: 'Sanitation Authority' },
      { username: 'authority4', password: 'auth123', department: 'electricity', location: 'Tamil Nadu', name: 'Electricity Authority' }
    ];

    for (const auth of defaults) {
      const existing = await this.getAuthorityByUsername(auth.username);
      if (!existing) {
        await this.createAuthority(auth);
      }
    }
  }
}

module.exports = new AuthorityModel();
