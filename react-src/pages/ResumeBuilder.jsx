import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/axios';

export default function ResumeBuilder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getCleanBase64 = (value) => {
    if (!value) return '';
    return String(value)
      .replace(/^data:application\/pdf;base64,/i, '')
      .replace(/\s/g, '');
  };

  const handleGenerateResume = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await api.post('/resume/generate');

      if (response.data.success) {
        setPdfData({
          base64: response.data.base64,
          filename: response.data.filename,
        });
        setSuccess(true);
      } else {
        setError(response.data.error || 'Failed to generate resume');
      }
    } catch (err) {
      console.error('Resume generation error:', err);
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to generate resume';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfData?.base64) return;

    try {
      const cleanBase64 = getCleanBase64(pdfData.base64);
      if (!cleanBase64) {
        setError('Invalid PDF data');
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
      setError('Failed to download PDF');
    }
  };

  const handlePreviewPdf = () => {
    setPreviewOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Resume Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Generate a professional resume in PDF format. The AI will create a
        LaTeX-formatted resume based on your profile information.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generate Your Resume
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Click the button below to generate a professional resume based on your
            profile data. The resume will be created using AI and compiled to PDF.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && !loading && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ Resume generated successfully!
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleGenerateResume}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {loading ? 'Generating...' : 'Generate Resume'}
            </Button>

            {pdfData && (
              <>
                <Button
                  variant="outlined"
                  onClick={handlePreviewPdf}
                  disabled={loading}
                >
                  Preview PDF
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDownloadPdf}
                  disabled={loading}
                  startIcon={<DownloadIcon />}
                >
                  Download PDF
                </Button>
              </>
            )}
          </Box>

          {pdfData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                <strong>File:</strong> {pdfData.filename}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Size:</strong>{' '}
                {(pdfData.base64.length / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How It Works
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" paragraph>
              Click "Generate Resume" to create your PDF resume
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              The system uses AI (Gemini) to generate professional LaTeX code based
              on your profile
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              The LaTeX is compiled into a PDF file
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              Download or preview your resume immediately
            </Typography>
          </Box>
        </CardContent>
      </Card>

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
