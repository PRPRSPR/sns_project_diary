import React, { useEffect, useState } from 'react';
import {
    Divider, Box, TextField, Button, Snackbar, Alert, Paper, Tooltip,
    Typography, Dialog, DialogTitle, MenuItem, DialogContent, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useLocation } from 'react-router-dom';
import CencelConfirm from './CencelConfirm';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../App.css'
import { getToken, isLoggedIn, logout, isTokenExpired } from '../utils/auth';
import AddButton from './AddButton';
import { jwtDecode } from 'jwt-decode';

const emotionTags = [
    { value: 'happy', label: '기쁨' },
    { value: 'sad', label: '슬픔' },
    { value: 'angry', label: '화남' },
    { value: 'excited', label: '신남' },
    { value: 'tired', label: '피곤' },
];

const Home = () => {
    const navigate = useNavigate();
    const [diaries, setDiaries] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [comments, setComments] = useState([]);
    const [mediaList, setMediaList] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyComment, setReplyComment] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editMemo, setEditMemo] = useState('');
    const [editEmotion, setEditEmotion] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [replyTarget, setReplyTarget] = useState(null);
    const [replyFormMap, setReplyFormMap] = useState({});
    const [editCommentMap, setEditCommentMap] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);

    const location = useLocation();
    const openDiaryId = location.state?.openDiaryId;

    const token = getToken();
    const email = jwtDecode(token).email;

    const emotionLabelMap = {
        happy: '기쁨',
        sad: '슬픔',
        angry: '화남',
        excited: '신남',
        tired: '피곤',
    };

    const handleOpen = (diary) => {
        console.log(diary);
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
        setIsEditMode(false);
        openDiary(email, token);
    };

    const renderComments = (comments) => {
        return comments.map((c) => {
            const isOwn = c.email === email;
            const isReply = !!c.parent_comment_id;
            const isReplyVisible = replyFormMap[c.id] || false;
            const isEditing = editingCommentId === c.id;

            return (
                <Box key={c.id} sx={{ pl: c.parent_id ? 4 : 0, mb: 1 }}>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: c.parent_id ? 'grey.50' : 'white' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mt={2}>
                            <Box display="flex" gap={1}>
                                {isReply && (
                                    <SubdirectoryArrowRightIcon fontSize="small" sx={{ mt: 0.5, color: 'gray' }} />
                                )}
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        {c.nickname}
                                    </Typography>

                                    {isEditing ? (
                                        <>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                value={editCommentMap[c.id] || ''}
                                                onChange={(e) =>
                                                    setEditCommentMap({ ...editCommentMap, [c.id]: e.target.value })
                                                }
                                                sx={{ mt: 1 }}
                                            />
                                            <Box mt={1} display="flex" gap={1}>
                                                <Button variant="contained" size="small" onClick={() => handleUpdateComment(c.id)}>
                                                    저장
                                                </Button>
                                                <Button variant="outlined" size="small" onClick={() => setEditingCommentId(null)}>
                                                    취소
                                                </Button>
                                            </Box>
                                        </>
                                    ) : (
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                                            {c.comment}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(c.created_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box display="flex" gap={0.5}>
                                <Tooltip title="답글">
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            setReplyFormMap((prev) => ({
                                                ...prev,
                                                [c.id]: !prev[c.id],
                                            }))
                                        }
                                    >
                                        <ReplyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>

                                {isOwn && !isEditing && (
                                    <>
                                        <Tooltip title="수정">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingCommentId(c.id);
                                                    setEditCommentMap({ ...editCommentMap, [c.id]: c.comment });
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="삭제">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteComment(c.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* 대댓글 작성 폼 */}
                        {isReplyVisible && (
                            <Box display="flex" alignItems="center" mt={1} gap={1}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="답글을 입력하세요"
                                    value={replyComment}
                                    onChange={(e) => setReplyComment(e.target.value)}
                                />
                                <Button variant="contained" size="small" onClick={() => handleAddComment(c.id)}>
                                    등록
                                </Button>
                            </Box>
                        )}
                    </Paper>

                    {/* 재귀 렌더링 */}
                    {c.replies && c.replies.length > 0 && (
                        <Box mt={1}>
                            {renderComments(c.replies)}
                        </Box>
                    )}
                </Box>
            );
        });
    };

    const handleAddComment = (parentId = null) => {
        if (!newComment.trim()) return;
        if (!replyComment.trim()) return;

        fetch(`http://localhost:3005/comments/${selectedDiary.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ email, comment: newComment, parentId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNewComment('');
                    setReplyComment('');
                    setReplyTarget(null);
                    handleOpen(selectedDiary);
                    setSnackbarMessage('댓글이 등록되었습니다.');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                } else {
                    console.error('댓글 등록 실패:', data.message);
                }
            })
            .catch(err => console.error('댓글 등록 오류:', err));
    };

    const handleUpdateComment = (commentId) => {
        const updatedComment = editCommentMap[commentId];

        fetch(`http://localhost:3005/comments/update/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ comment: updatedComment }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setEditingCommentId(null);
                    setEditCommentMap({});
                    handleOpen(selectedDiary); // 댓글 목록 재조회
                }
            });
    };

    const handleDeleteComment = (commentId) => {
        if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

        fetch(`http://localhost:3005/comments/delete/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    handleOpen(selectedDiary);
                }
            });
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

    const handleDelete = async () => {
        try {
            fetch(`http://localhost:3005/diary/${selectedDiary.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        handleClose();
                        openDiary(email, token);
                        setSnackbarMessage('일기가 삭제되었습니다.');
                        setSnackbarSeverity('success');
                        setSnackbarOpen(true);
                    }
                })
                .catch(err => {
                    handleClose();
                    openDiary(email, token);
                    setSnackbarMessage('일기 삭제 실패');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                });
        } catch (err) {
            console.error(err);
            alert('서버 오류로 삭제 실패');
        }
    };

    const handleSaveEdit = async () => {
        const isOwner = selectedDiary?.email === email;
        const isEditableTime = new Date() <= new Date(selectedDiary?.editable_until);

        if (!isOwner || !isEditableTime) {
            setSnackbarMessage('수정 권한이 없거나 수정 가능한 시간이 지났습니다.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setIsEditMode(false);
            return;
        }

        try {
            fetch(`http://localhost:3005/diary/${selectedDiary.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emotion_tag: editEmotion,
                    memo: editMemo,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSelectedDiary((prev) => ({
                            ...prev,
                            emotion_tag: editEmotion,
                            memo: editMemo,
                        }));
                        setIsEditMode(false);
                        setSnackbarMessage('일기가 수정되었습니다.');
                        setSnackbarSeverity('success');
                        setSnackbarOpen(true);
                    }
                })
                .catch(err => {
                    setSnackbarMessage('일기 수정 실패');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                });
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했습니다.');
        }
    };

    const openDiary = (email, token) => {
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
    }

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
        if (isTokenExpired()) {
            logout();
            navigate('/');
            return;
        }

        openDiary(email, token);

    }, [navigate, location, email, token]);

    const isOwner = selectedDiary?.email === email;
    const isEditableTime = new Date() <= new Date(selectedDiary?.editable_until);
    const canEdit = isOwner && isEditableTime;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
            <Typography variant="h5" gutterBottom>내 달력</Typography>

            <Box display="flex" gap={4} flexWrap="wrap" mb={4}>
                <Calendar
                    calendarType="iso8601"
                    tileClassName={({ date, view }) => {
                        if (view === 'month' && date.getDay() === 6) {
                            return 'saturday';
                        }
                        return null;
                    }}
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
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        color: '#333',
                                        fontWeight: 'bold',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        fontSize: '0.75rem',
                                        zIndex: 2,
                                    }}
                                >
                                    {emotionLabelMap[diary.emotion_tag] || diary.emotion_tag}
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
                    <Box sx={{ position: 'absolute', top: 8, right: 50, display: 'flex', gap: 1 }}>
                        {canEdit && (!isEditMode ? (
                            <IconButton onClick={() => {
                                setIsEditMode(true);
                                setEditMemo(selectedDiary.memo);
                                setEditEmotion(selectedDiary.emotion_tag);
                            }}>
                                <EditIcon />
                            </IconButton>
                        ) : (
                            <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                                <Button variant="contained" color="primary" onClick={handleSaveEdit}>
                                    저장
                                </Button>
                                <Button variant="outlined" onClick={() => setIsEditMode(false)}>
                                    취소
                                </Button>
                            </Box>
                        ))}
                        <IconButton onClick={() => setDialogOpen(true)}>
                            <DeleteIcon />
                        </IconButton>
                        <CencelConfirm
                            open={dialogOpen}
                            onClose={() => setDialogOpen(false)}
                            onConfirm={handleDelete}
                            title="일기 삭제"
                            content="이 일기를 삭제"
                        />
                    </Box>
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
                            {isEditMode ? (
                                <>
                                    <TextField
                                        select
                                        fullWidth
                                        label="감정 태그"
                                        value={editEmotion}
                                        onChange={(e) => setEditEmotion(e.target.value)}
                                        sx={{ mt: 2, mb: 2 }}
                                    >
                                        {emotionTags.map((tag) => (
                                            <MenuItem key={tag.value} value={tag.value}>
                                                {tag.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={8}
                                        value={editMemo}
                                        onChange={(e) => setEditMemo(e.target.value)}
                                        sx={{ whiteSpace: 'pre-line' }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Typography variant="h6">{emotionLabelMap[selectedDiary?.emotion_tag] || selectedDiary?.emotion_tag}</Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                        {selectedDiary?.memo}
                                    </Typography>
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1">댓글</Typography>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                {renderComments(comments)}
                            </Box>

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
            <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <AddButton></AddButton>
        </div>
    );
};

export default Home;
