const AWS = require('aws-sdk');
const mockDB = require('../utils/mockDB');

const USE_MOCK = process.env.AWS_ACCESS_KEY_ID === 'local-dev';

const dynamodb = USE_MOCK ? null : new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const TABLE_NAME = process.env.DYNAMODB_REPORTS_TABLE;

class ReportModel {
  async createReport(report) {
    if (USE_MOCK) {
      return await mockDB.putReport(report);
    }
    const params = {
      TableName: TABLE_NAME,
      Item: report
    };
    await dynamodb.put(params).promise();
    return report;
  }

  async getReportById(reportId) {
    if (USE_MOCK) {
      return await mockDB.getReport(reportId);
    }
    const params = {
      TableName: TABLE_NAME,
      Key: { reportId }
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  async getReportsByUserId(userId) {
    if (USE_MOCK) {
      return await mockDB.getReportsByUserId(userId);
    }
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };
    const result = await dynamodb.query(params).promise();
    return result.Items;
  }

  async getAllReports() {
    if (USE_MOCK) {
      return await mockDB.getAllReports();
    }
    const params = {
      TableName: TABLE_NAME
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items;
  }

  async updateReport(reportId, updates) {
    if (USE_MOCK) {
      return await mockDB.updateReport(reportId, updates);
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
      Key: { reportId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  async deleteReport(reportId) {
    if (USE_MOCK) {
      return await mockDB.deleteReport(reportId);
    }
    const params = {
      TableName: TABLE_NAME,
      Key: { reportId }
    };
    await dynamodb.delete(params).promise();
  }
}

module.exports = new ReportModel();
