import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export default function CVUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch CV list on component mount
  useState(() => {
    fetchCVList();
  }, []);

  const fetchCVList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/cv/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCvList(response.data.cvs || []);
    } catch (err) {
      console.error('Failed to fetch CV list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('cv', selectedFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/cv/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadResult(response.data);
      setSelectedFile(null);
      
      // Refresh CV list
      await fetchCVList();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload CV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (cvId) => {
    if (!(await sweetConfirm('Are you sure you want to delete this CV?'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/cv/${cvId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh CV list
      await fetchCVList();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete CV. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CV Management
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload your CV to enable personalized interview coaching with AI
      </Typography>

      {/* Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload New CV
          </Typography>

          <Box sx={{ mb: 2 }}>
            <input
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              id="cv-file-input"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="cv-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
                fullWidth
              >
                Select CV File
              </Button>
            </label>
          </Box>

          {selectedFile && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              </Alert>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading}
                fullWidth
                startIcon={<UploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload CV'}
              </Button>
            </Box>
          )}

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {uploadProgress}% uploaded
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {uploadResult && (
            <Alert severity="success">
              <Typography variant="body2">
                ✓ CV uploaded successfully!
              </Typography>
              <Typography variant="caption" display="block">
                {uploadResult.chunks_created} chunks created, {uploadResult.vectors_created} vectors stored
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* CV List Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your CVs
          </Typography>

          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : cvList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No CVs uploaded yet. Upload your first CV to get started!
            </Typography>
          ) : (
            <List>
              {cvList.map((cv) => (
                <ListItem
                  key={cv.cv_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(cv.cv_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <FileIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={cv.original_filename}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Uploaded: {formatDate(cv.created_at)}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label="Original"
                            size="small"
                            component="a"
                            href={cv.s3_url}
                            target="_blank"
                            clickable
                            sx={{ mr: 0.5, fontSize: '0.7rem' }}
                          />
                          <Chip
                            label="Markdown"
                            size="small"
                            component="a"
                            href={cv.s3_md_url}
                            target="_blank"
                            clickable
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="caption">
            <strong>Supported formats:</strong> PDF, DOCX, DOC, TXT (max 10MB)
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}
