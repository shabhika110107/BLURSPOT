const axios = require('axios');

class DiscordService {
  getWebhookUrl(category) {
    const webhooks = {
      roads: process.env.DISCORD_WEBHOOK_ROADS,
      water: process.env.DISCORD_WEBHOOK_WATER,
      sanitation: process.env.DISCORD_WEBHOOK_SANITATION,
      electricity: process.env.DISCORD_WEBHOOK_ELECTRICITY
    };
    return webhooks[category.toLowerCase()] || process.env.DISCORD_WEBHOOK_GENERAL;
  }

  getDepartmentCredentials(category) {
    const credentials = {
      roads: { username: 'authority1', password: 'auth123' },
      water: { username: 'authority2', password: 'auth123' },
      sanitation: { username: 'authority3', password: 'auth123' },
      electricity: { username: 'authority4', password: 'auth123' }
    };
    return credentials[category.toLowerCase()] || credentials.roads;
  }

  async notifyNewReport(report, user) {
    try {
      const webhookUrl = this.getWebhookUrl(report.category);
      console.log('Discord webhook URL:', webhookUrl);
      console.log('Report category:', report.category);
      
      if (!webhookUrl || webhookUrl === 'undefined' || webhookUrl.includes('mock')) {
        console.log('Skipping Discord notification - no valid webhook');
        return;
      }

      const credentials = this.getDepartmentCredentials(report.category);

      const embed = {
        title: `🚨 ${report.title || 'New Issue Reported'}`,
        description: report.description,
        color: 16711680,
        fields: [
          { name: 'Type', value: report.type, inline: true },
          { name: 'Category', value: report.category.toUpperCase(), inline: true },
          { name: 'Seriousness', value: report.seriousness, inline: true },
          { name: 'Location', value: `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`, inline: false },
          { name: 'Noticed Time', value: report.noticedTime || 'Not specified', inline: true },
          { name: 'Reported At', value: new Date(report.createdAt).toLocaleString(), inline: true },
          { name: '🔐 Login Credentials', value: `Username: ${credentials.username}\nPassword: ${credentials.password}`, inline: false },
          { name: '🔗 Login URL', value: 'http://localhost:3000/login', inline: false }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `Report ID: ${report.reportId}` }
      };

      // Only add image if it's a real URL (not base64)
      if (report.images && report.images.length > 0) {
        const firstImage = report.images[0];
        if (!firstImage.includes('mock') && !firstImage.startsWith('data:')) {
          embed.image = { url: firstImage };
        }
      }

      const payload = {
        content: `@everyone **New ${report.category.toUpperCase()} Department Issue!**`,
        embeds: [embed]
      };

      console.log('Sending Discord notification to:', webhookUrl);
      const response = await axios.post(webhookUrl, payload);
      console.log('Discord notification sent successfully:', response.status);
      
      // Send additional images if available (skip base64)
      if (report.images && report.images.length > 1) {
        for (let i = 1; i < Math.min(report.images.length, 4); i++) {
          const img = report.images[i];
          if (!img.includes('mock') && !img.startsWith('data:')) {
            await axios.post(webhookUrl, {
              embeds: [{ image: { url: img }, color: 16711680 }]
            });
          }
        }
      }
    } catch (error) {
      console.error('Discord notification error:', error.response?.data || error.message);
      console.error('Full error:', error);
    }
  }

  async notifyUpvote(report, upvoteCount) {
    try {
      const webhookUrl = this.getWebhookUrl(report.category);
      if (!webhookUrl || webhookUrl.includes('mock')) return;

      const embed = {
        title: '👍 Issue Upvoted',
        description: report.title || report.description,
        color: 16776960,
        fields: [
          { name: 'Report ID', value: report.reportId, inline: true },
          { name: 'Total Upvotes', value: upvoteCount.toString(), inline: true },
          { name: 'Category', value: report.category.toUpperCase(), inline: true },
          { name: 'Status', value: report.status, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await axios.post(webhookUrl, {
        content: `📊 **Upvote Alert** - Issue gaining attention!`,
        embeds: [embed]
      });
    } catch (error) {
      console.error('Discord upvote notification error:', error.message);
    }
  }

  async notifyStatusUpdate(report, status) {
    try {
      const webhookUrl = this.getWebhookUrl(report.category);
      if (!webhookUrl || webhookUrl.includes('mock')) return;

      const colors = {
        Reviewed: 0xffff00,
        Assigned: 0x00ff00,
        'Work Over': 0x0000ff,
        Completed: 0x00ff00
      };

      const embed = {
        title: `📋 Report Status Updated: ${status}`,
        description: report.title || report.description,
        color: colors[status] || 0x808080,
        fields: [
          { name: 'Report ID', value: report.reportId, inline: true },
          { name: 'New Status', value: status, inline: true },
          { name: 'Category', value: report.category.toUpperCase(), inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await axios.post(webhookUrl, {
        content: `🔔 **Status Update** - Report has been updated`,
        embeds: [embed]
      });
    } catch (error) {
      console.error('Discord notification error:', error.message);
    }
  }

  async notifyCompletion(report, user) {
    try {
      const webhookUrl = this.getWebhookUrl(report.category);
      if (!webhookUrl) return;

      const embed = {
        title: '✅ Report Completed',
        description: report.description,
        color: 0x00ff00,
        fields: [
          { name: 'Report ID', value: report.reportId, inline: true },
          { name: 'Reporter', value: user.name, inline: true },
          { name: 'Karma Earned', value: '+10 points', inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      if (report.completionImages && report.completionImages.length > 0) {
        embed.image = { url: report.completionImages[0] };
      }

      await axios.post(webhookUrl, {
        embeds: [embed]
      });
    } catch (error) {
      console.error('Discord notification error:', error.message);
    }
  }
}

module.exports = new DiscordService();
