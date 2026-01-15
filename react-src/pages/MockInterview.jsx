import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, List, ListItem, ListItemText, Radio, RadioGroup, FormControlLabel, CircularProgress, Alert, Divider, TextField, Checkbox, Stack, MenuItem } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MockInterview() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Generated questions state
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [scheduleId, setScheduleId] = useState('');
  const [persist, setPersist] = useState(false);

  // Schedules (for the dropdown)
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const fetchResumes = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/mock-interview/resumes/${user.user_id}`);
      setResumes(res.data.resumes || []);
      if (res.data.resumes && res.data.resumes.length) setSelected(String(res.data.resumes[0].index));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load resumes');
    } finally { setLoading(false); }
  };

  const fetchSchedules = async () => {
    if (!user) return;
    setSchedulesLoading(true);
    try {
      const res = await api.get('/interviews', { params: { user_id: user.user_id } });
      setSchedules(res.data || []);
      if (res.data && res.data.length && !scheduleId) setScheduleId(String(res.data[0].interview_id));
    } catch (err) {
      console.error('Failed to load schedules', err);
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => { if (user) { fetchResumes(); fetchSchedules(); } }, [user]);

  const handleExtract = async () => {
    if (selected === null) return;
    setExtracting(true); setError(''); setResult(null); setQuestions([]);
    try {
      const idx = Number(selected);
      const res = await api.get(`/mock-interview/resume-extract/${user.user_id}?index=${idx}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extract resume');
    } finally { setExtracting(false); }
  };

  const handleGenerate = async () => {
    if (!result) return;
    if (!scheduleId) { setError('schedule_id is required to generate questions'); return; }
    setGenerating(true); setError(''); setQuestions([]);
    try {
      const idx = Number(selected);
      const payload = { schedule_id: Number(scheduleId), index: idx, question_count: Number(questionCount), persist };
      const res = await api.post('/mock-interview/generate-questions', payload);
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate questions');
    } finally { setGenerating(false); }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{mt:2, mb:2}}>Mock Interview — Resume Extractor</Typography>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <Paper sx={{p:2, display:'flex', gap:2}}>
        <Box sx={{width:320}}>
          <Typography variant="h6">Resumes</Typography>
          <Divider sx={{my:1}} />
          {loading ? <CircularProgress /> : (
            <RadioGroup value={selected} onChange={(e)=>setSelected(e.target.value)}>
              <List>
                {resumes.map(r => (
                  <ListItem key={r.index} disablePadding>
                    <FormControlLabel value={String(r.index)} control={<Radio />} label={<ListItemText primary={r.filename} secondary={r.is_pdf ? 'PDF' : 'Not PDF'} />} />
                  </ListItem>
                ))}
              </List>
            </RadioGroup>
          )}

          <Box sx={{mt:2}}>
            <Button variant="contained" onClick={handleExtract} disabled={extracting || !selected}>{extracting ? 'Extracting...' : 'Extract'}</Button>
            <Button sx={{ml:2}} onClick={fetchResumes}>Refresh</Button>
          </Box>
        </Box>

        <Box sx={{flex:1}}>
          <Typography variant="h6">Preview</Typography>
          <Divider sx={{my:1}} />
          {!result && <Typography variant="body2">No extraction yet. Select a PDF resume and click Extract.</Typography>}
          {result && (
            <Box>
              <Typography variant="subtitle1">File: {result.filename} ({result.numpages} pages)</Typography>
              <Typography variant="subtitle2" sx={{mt:1}}>Emails: {result.metadata.emails.join(', ') || '—'}</Typography>
              <Typography variant="subtitle2" sx={{mt:1}}>Phones: {result.metadata.phones.join(', ') || '—'}</Typography>
              <Typography variant="subtitle2" sx={{mt:1}}>Skills: {result.metadata.skills.join(', ') || '—'}</Typography>
              <Divider sx={{my:1}} />
              <Typography variant="body2" sx={{whiteSpace:'pre-wrap', maxHeight: 200, overflow: 'auto'}}>{result.text.slice(0, 8000)}</Typography>

              <Divider sx={{my:2}} />

              <Stack direction="row" spacing={2} alignItems="center" sx={{mb:2}}>
                <TextField select label="Schedule" size="small" value={scheduleId} onChange={(e)=>setScheduleId(e.target.value)} helperText={schedulesLoading ? 'Loading schedules...' : 'Select interview schedule'} sx={{minWidth:280}}>
                  <MenuItem value="">Select schedule</MenuItem>
                  {schedules.map(s => (
                    <MenuItem key={s.interview_id} value={String(s.interview_id)}>
                      {`${s.company_name} — ${new Date(s.scheduled_at).toLocaleString()}`}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Question Count" size="small" type="number" value={questionCount} onChange={(e)=>setQuestionCount(Number(e.target.value))} />
                <FormControlLabel control={<Checkbox checked={persist} onChange={(e)=>setPersist(e.target.checked)} />} label="Persist (save to DB)" />
                <Button variant="contained" onClick={handleGenerate} disabled={generating || !scheduleId}>{generating ? 'Generating...' : 'Generate Questions'}</Button>
              </Stack>

              {questions && questions.length > 0 && (
                <Box>
                  <Typography variant="h6">Generated Questions</Typography>
                  <List>
                    {questions.map((q, idx) => (
                      <ListItem key={idx} alignItems="flex-start">
                        <ListItemText
                          primary={`${idx+1}. ${q.question}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">Difficulty: {q.difficulty || 'medium'} — {q.focus_area}</Typography>
                              <Typography variant="body2" sx={{display:'block', mt:1}}>{q.example_answer}</Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
