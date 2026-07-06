const AWS = require('aws-sdk');

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class RekognitionService {
  async validateImage(imageKey, category) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.S3_BUCKET_NAME,
            Name: imageKey
          }
        },
        MaxLabels: 20,
        MinConfidence: 60
      };

      const result = await rekognition.detectLabels(params).promise();
      const labels = result.Labels.map(l => l.Name.toLowerCase());

      // Category-specific validation
      const validationRules = {
        roads: ['road', 'street', 'asphalt', 'pavement', 'highway', 'pothole', 'crack'],
        water: ['water', 'pipe', 'leak', 'plumbing', 'drain', 'sewer', 'flood'],
        sanitation: ['trash', 'garbage', 'waste', 'litter', 'bin', 'dump', 'debris'],
        electricity: ['wire', 'cable', 'pole', 'electric', 'power', 'light', 'lamp'],
        other: ['building', 'structure', 'outdoor', 'urban']
      };

      const relevantLabels = validationRules[category.toLowerCase()] || validationRules.other;
      const hasRelevantLabel = labels.some(label => 
        relevantLabels.some(relevant => label.includes(relevant) || relevant.includes(label))
      );

      // Reject obvious non-relevant images
      const irrelevantLabels = ['food', 'meal', 'lunch', 'dinner', 'person', 'face', 'selfie'];
      const hasIrrelevantLabel = labels.some(label => 
        irrelevantLabels.some(irrelevant => label.includes(irrelevant))
      );

      if (hasIrrelevantLabel) {
        console.log('Image rejected - irrelevant content:', labels);
        return false;
      }

      if (!hasRelevantLabel) {
        console.log('Image validation uncertain:', labels);
        // Allow if outdoor/urban context
        if (labels.includes('outdoor') || labels.includes('urban')) {
          return true;
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Rekognition error:', error);
      // Allow image if Rekognition fails (don't block users)
      return true;
    }
  }

  async detectText(imageKey) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.S3_BUCKET_NAME,
            Name: imageKey
          }
        }
      };

      const result = await rekognition.detectText(params).promise();
      return result.TextDetections.map(t => t.DetectedText);
    } catch (error) {
      console.error('Text detection error:', error);
      return [];
    }
  }
}

module.exports = new RekognitionService();
