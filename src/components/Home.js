import React, { useEffect, useState } from 'react';
import {
    Divider, List, ListItem, ListItemText, Box, TextField, Button,
    Typography, Dialog, DialogTitle,
    DialogContent, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useNavigate, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../App.css'
import { getToken, isLoggedIn } from '../utils/auth';
import AddButton from './AddButton';
import { jwtDecode } from 'jwt-decode';

const Home = () => {
    const navigate = useNavigate();
    const [diaries, setDiaries] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [comments, setComments] = useState([]);
    const [mediaList, setMediaList] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const location = useLocation();
    const openDiaryId = location.state?.openDiaryId;

    const handleOpen = (diary) => {
        fetch(`http://localhost:3005/diary/detail/${diary.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCurrentIndex(0);
                    setSelectedDiary(data.detail);
                    setComments(data.comments || []);
                    setMediaList(data.media || []);
                    setOpen(true);
                } else {
                    console.error('서버 응답 실패:', data.message);
                }
            })
            .catch(err => console.error('fetch 에러:', err));
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDiary(null);
    };

    const handleAddComment = () => {
        fetch(`http://localhost:3005/comments/${selectedDiary.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment: newComment })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setComments(prev => [...prev, data.comment]);
                    setNewComment('');
                } else {
                    console.error('댓글 등록 실패:', data.message);
                }
            })
            .catch(err => console.error('댓글 등록 오류:', err));
    };

    useEffect(() => {
        if (openDiaryId) {
            fetch(`http://localhost:3005/diary/detail/${openDiaryId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setCurrentIndex(0);
                        setSelectedDiary(data.detail);
                        setComments(data.comments || []);
                        setMediaList(data.media || []);
                        setOpen(true);
                    } else {
                        console.error('상세보기 실패:', data.message);
                    }
                })
                .catch(err => console.error('상세보기 에러:', err));
        }
    }, [openDiaryId]);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const filteredDiaries = selectedDate
        ? diaries.filter(d => formatDate(new Date(d.date)) === formatDate(selectedDate))
        : diaries;

    const handleSlide = (direction) => {
        if (!mediaList || mediaList.length === 0) return;

        if (direction === 'left' && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else if (direction === 'right' && currentIndex < mediaList.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
            navigate('/home', { replace: true });
            return;
        }

        if (!isLoggedIn()) {
            navigate('/');
            return;
        }
        const token = getToken();
        let email = '';
        if (token) {
            try {
                const decoded = jwtDecode(token);
                email = decoded.email;
            } catch (err) {
                console.error('토큰 디코드 실패:', err);
                navigate('/');
                return;
            }
        }

        fetch(`http://localhost:3005/diary/${email}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiaries(data.list);
                } else {
                    console.error('다이어리 로딩 실패');
                }
            })
            .catch(err => console.error(err));
    }, [navigate, location]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
            <Typography variant="h5" gutterBottom>내 달력</Typography>

            <Box display="flex" gap={4} flexWrap="wrap" mb={4}>
                <Calendar
                    calendarType="iso8601"
                    tileContent={({ date, view }) => {
                        if (view !== 'month') return null;

                        const formatDate = (d) => new Date(d).toISOString().split('T')[0];
                        const diary = diaries.find(d => formatDate(d.date) === formatDate(date));
                        if (!diary) return null;

                        return (
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleOpen(diary)}
                            >
                                {!diary.thumbnailPath.endsWith('.mp4') ? (
                                    <Box
                                        component="img"
                                        src={`http://localhost:3005/${diary.thumbnailPath}`}
                                        alt="썸네일"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            zIndex: 1,
                                        }}
                                    />
                                ) : (
                                    <video
                                        muted
                                        autoPlay
                                        loop
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            zIndex: 1,
                                        }}
                                    >
                                        <source src={`http://localhost:3005/${diary.thumbnailPath}`} type="video/mp4" />
                                    </video>
                                )}

                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        fontSize: '0.75rem',
                                        zIndex: 2,
                                    }}
                                >
                                    {diary.emotion_tag}
                                </Box>
                            </Box>
                        );
                    }}
                />
            </Box>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" disableEnforceFocus>
                <DialogTitle>
                    일기 상세
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 3, height: '500px' }}>
                        <Box sx={{ width: '50%', position: 'relative' }}>
                            <IconButton
                                onClick={() => handleSlide('left')}
                                disabled={currentIndex === 0}
                                sx={{ position: 'absolute', top: '45%', left: -20, zIndex: 2 }}
                            >
                                <ArrowBackIosNewIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handleSlide('right')}
                                disabled={currentIndex === mediaList.length - 1}
                                sx={{ position: 'absolute', top: '45%', right: -20, zIndex: 2 }}
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>

                            <Box
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    height: 450,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {mediaList.length > 0 && (
                                    <Box
                                        key={mediaList[currentIndex].id}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    >
                                        {mediaList[currentIndex].mediaType === 'image' ? (
                                            <img
                                                src={`http://localhost:3005/${mediaList[currentIndex].mediaPath}`}
                                                key={mediaList[currentIndex].id}
                                                alt="media"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <video
                                                controls
                                                key={mediaList[currentIndex].id}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            >
                                                <source
                                                    src={`http://localhost:3005/${mediaList[currentIndex].mediaPath}`}
                                                    type="video/mp4"
                                                />
                                            </video>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ width: '50%', overflowY: 'auto' }}>
                            <Typography variant="h6">{selectedDiary?.emotion_tag}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {selectedDiary?.memo}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1">댓글</Typography>
                            <List sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                {comments.map((c) => (
                                    <ListItem key={c.id}>
                                        <ListItemText primary={c.nickname} secondary={c.comment} />
                                    </ListItem>
                                ))}
                            </List>

                            <Box display="flex" alignItems="center" mt={2} gap={1}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="댓글을 입력하세요"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button variant="contained" onClick={handleAddComment}>
                                    등록
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            <AddButton></AddButton>
        </div>
    );
};

export default Home;
