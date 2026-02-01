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
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export default function CVUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Resume Builder state
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getCleanBase64 = (value) => {
    if (!value) return '';
    return String(value)
      .replace(/^data:application\/pdf;base64,/i, '')
      .replace(/\s/g, '');
  };

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

  // Resume Builder handlers
  const handleGenerateResume = async () => {
    try {
      setResumeLoading(true);
      setResumeError(null);
      setResumeSuccess(false);

      const response = await api.post('/resume/generate');

      if (response.data.success) {
        setPdfData({
          base64: response.data.base64,
          filename: response.data.filename,
        });
        setResumeSuccess(true);
      } else {
        setResumeError(response.data.error || 'Failed to generate resume');
      }
    } catch (err) {
      console.error('Resume generation error:', err);
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to generate resume';
      setResumeError(errorMessage);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfData?.base64) return;

    try {
      const cleanBase64 = getCleanBase64(pdfData.base64);
      if (!cleanBase64) {
        setResumeError('Invalid PDF data');
        return;
      }

      const response = await fetch(`data:application/pdf;base64,${cleanBase64}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfData.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setResumeError('Failed to download PDF');
    }
  };

  const handlePreviewPdf = () => {
    setPreviewOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CV & Resume Management
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload your CV or generate a professional resume from your profile
      </Typography>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Upload CV" />
          <Tab label="Generate Resume" />
        </Tabs>

        {/* Tab 1: Upload CV */}
        {tabValue === 0 && (
          <CardContent>

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
        )}

        {/* Tab 2: Generate Resume */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generate Your Professional Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click the button below to generate a professional resume based on your
              profile data. The resume will be created using AI and compiled to PDF.
            </Typography>

            {resumeError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {resumeError}
              </Alert>
            )}

            {resumeSuccess && !resumeLoading && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Resume generated successfully!
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateResume}
                disabled={resumeLoading}
                startIcon={resumeLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {resumeLoading ? 'Generating...' : 'Generate Resume'}
              </Button>

              {pdfData && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handlePreviewPdf}
                    disabled={resumeLoading}
                  >
                    Preview PDF
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleDownloadPdf}
                    disabled={resumeLoading}
                    startIcon={<DownloadIcon />}
                  >
                    Download PDF
                  </Button>
                </>
              )}
            </Box>

            {pdfData && (
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>File:</strong> {pdfData.filename}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Size:</strong>{' '}
                  {(pdfData.base64.length / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                How It Works:
              </Typography>
              <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                <Typography component="li" variant="body2">
                  Click "Generate Resume" to create your PDF resume
                </Typography>
                <Typography component="li" variant="body2">
                  The system uses AI (Gemini) to generate professional LaTeX code based on your profile
                </Typography>
                <Typography component="li" variant="body2">
                  The LaTeX is compiled into a PDF file
                </Typography>
                <Typography component="li" variant="body2">
                  Download or preview your resume immediately
                </Typography>
              </Box>
            </Box>
          </CardContent>
        )}
      </Card>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="caption">
            <strong>CV Supported formats:</strong> PDF, DOCX, DOC, TXT (max 10MB) | 
            <strong style={{ marginLeft: '0.5rem' }}>Resume:</strong> Generated from your profile data
          </Typography>
        </Alert>
      </Box>

      {/* PDF Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Resume Preview
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {pdfData?.base64 ? (
            <Box
              sx={{
                width: '100%',
                height: 600,
                mt: 2,
              }}
            >
              <iframe
                src={`data:application/pdf;base64,${getCleanBase64(pdfData.base64)}`}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: 4 }}
                title="Resume Preview"
              />
            </Box>
          ) : (
            <Typography>No PDF available for preview</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
