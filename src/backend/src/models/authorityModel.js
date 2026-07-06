const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mockDB = require('../utils/mockDB');

const USE_MOCK = process.env.AWS_ACCESS_KEY_ID === 'local-dev';

const dynamodb = USE_MOCK ? null : new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const TABLE_NAME = process.env.DYNAMODB_AUTHORITIES_TABLE;

class AuthorityModel {
  async createAuthority(authority) {
    const authData = {
      authorityId: uuidv4(),
      ...authority,
      password: await bcrypt.hash(authority.password, 10),
      createdAt: new Date().toISOString()
    };
    
    if (USE_MOCK) {
      return await mockDB.putAuthority(authData);
    }
    
    const params = {
      TableName: TABLE_NAME,
      Item: authData
    };
    await dynamodb.put(params).promise();
    return authData;
  }

  async getAuthorityById(authorityId) {
    if (USE_MOCK) {
      return await mockDB.getAuthority(authorityId);
    }
    const params = {
      TableName: TABLE_NAME,
      Key: { authorityId }
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  async getAuthorityByUsername(username) {
    if (USE_MOCK) {
      return await mockDB.getAuthorityByUsername(username);
    }
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: { ':username': username }
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items[0];
  }

  async getAllAuthorities() {
    if (USE_MOCK) {
      return await mockDB.getAllAuthorities();
    }
    const params = {
      TableName: TABLE_NAME
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items;
  }

  async updateAuthority(authorityId, updates) {
    if (USE_MOCK) {
      const authority = await mockDB.getAuthority(authorityId);
      if (authority) {
        Object.assign(authority, updates);
        await mockDB.putAuthority(authority);
      }
      return authority;
    }
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach((key, index) => {
      updateExpression.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = updates[key];
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { authorityId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  // Initialize default authorities
  async initializeDefaults() {
    const defaults = [
      { username: 'authority1', password: 'auth123', department: 'roads', location: 'Tamil Nadu', name: 'Roads Authority' },
      { username: 'authority2', password: 'auth123', department: 'water', location: 'Tamil Nadu', name: 'Water Authority' },
      { username: 'authority3', password: 'auth123', department: 'sanitation', location: 'Tamil Nadu', name: 'Sanitation Authority' },
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
