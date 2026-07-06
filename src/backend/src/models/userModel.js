const AWS = require('aws-sdk');

const mockDB = require('../utils/mockDB');

const USE_MOCK = process.env.AWS_ACCESS_KEY_ID === 'local-dev';

const dynamodb = USE_MOCK ? null : new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const TABLE_NAME = process.env.DYNAMODB_USERS_TABLE;

class UserModel {
  async createUser(user) {
    if (USE_MOCK) {
      return await mockDB.putUser(user);
    }
    const params = {
      TableName: TABLE_NAME,
      Item: user
    };
    await dynamodb.put(params).promise();
    return user;
  }

  async getUserById(userId) {
    if (USE_MOCK) {
      return await mockDB.getUser(userId);
    }
    const params = {
      TableName: TABLE_NAME,
      Key: { userId }
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  async getUserByEmail(email) {
    if (USE_MOCK) {
      return await mockDB.getUserByEmail(email);
    }
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items[0];
  }

  async updateUser(userId, updates) {
    if (USE_MOCK) {
      return await mockDB.updateUser(userId, updates);
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
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  async updateUserKarma(userId, karma) {
    return await this.updateUser(userId, { karma });
  }

  async getAllUsers() {
    if (USE_MOCK) {
      return await mockDB.getAllUsers();
    }
    const params = {
      TableName: TABLE_NAME
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items;
  }

  async deleteUser(userId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userId }
    };
    await dynamodb.delete(params).promise();
  }
}

module.exports = new UserModel();
