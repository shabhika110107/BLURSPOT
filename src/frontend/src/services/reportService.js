import axios from 'axios';
import { authService } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ReportService {
  getAuthHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${authService.getToken()}`
      }
    };
  }

  async createReport(formData) {
    const response = await axios.post(
      `${API_URL}/reports`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async getReports(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${API_URL}/reports?${params}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getReportById(id) {
    const response = await axios.get(
      `${API_URL}/reports/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async updateReportStatus(id, status, proofImages, notes) {
    const response = await axios.put(
      `${API_URL}/reports/${id}/status`,
      { status, proofImages, notes },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async verifyReport(id, verified) {
    const response = await axios.post(
      `${API_URL}/reports/${id}/verify`,
      { verified },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async uploadProofImages(id, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('proofImages', file));
    
    const response = await axios.post(
      `${API_URL}/reports/${id}/proof`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async getAllReports() {
    const response = await axios.get(
      `${API_URL}/reports/all`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async upvoteReport(id) {
    const response = await axios.post(
      `${API_URL}/reports/${id}/upvote`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  async checkDuplicate(latitude, longitude) {
    const response = await axios.post(
      `${API_URL}/reports/check-duplicate`,
      { latitude, longitude },
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export const reportService = new ReportService();
