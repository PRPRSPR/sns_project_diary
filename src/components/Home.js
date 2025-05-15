import { useEffect, useState } from 'react';
import {
    Divider, Box, TextField, Button, Snackbar, Alert, Tooltip, Menu,
    Typography, Dialog, DialogTitle, MenuItem, DialogContent, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
    const [replyCommentMap, setReplyCommentMap] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editMemo, setEditMemo] = useState('');
    const [editEmotion, setEditEmotion] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [commentDialog, setCommentDialog] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [replyTarget, setReplyTarget] = useState(null);
    const [replyFormMap, setReplyFormMap] = useState({});
    const [editCommentMap, setEditCommentMap] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [expandedCommentIds, setExpandedCommentIds] = useState({});
    const [anchorElMap, setAnchorElMap] = useState({});

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
        setNewComment('');
        setReplyCommentMap({});
        setReplyFormMap({});
        setEditCommentMap({});
        setEditingCommentId(null);
        setReplyTarget(null);
    };

    const renderComments = (comments, depth = 0) => {
        const maxIndentDepth = 2;
        const hideDepth = 3;
        return comments.map((c) => {
            const isOwn = c.email === email;
            const isReplyVisible = replyFormMap[c.id] || false;
            const isEditing = editingCommentId === c.id;
            const effectiveDepth = Math.min(depth, maxIndentDepth);
            const shouldHideReplies = depth >= hideDepth && !expandedCommentIds[c.id];

            return (
                <Box
                    key={c.id}
                    sx={{
                        pl: effectiveDepth * 1,
                        ml: effectiveDepth,
                        borderLeft: depth > 0 ? '1px dashed rgba(63, 63, 63, 0.2)' : 'none',
                        mb: 1,
                    }}
                >
                    <Box
                        className="comment-container"
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            '&:hover .comment-actions': {
                                opacity: 1,
                            },
                            '.comment-container:hover &': {
                                opacity: 1,
                            },
                        }}
                    >
                        <Box display="flex" gap={1}>
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
                                ) : c.is_deleted ? (
                                    <Typography variant="body2" fontStyle="italic" color="text.secondary" sx={{ mt: 1 }}>
                                        삭제된 댓글입니다.
                                    </Typography>
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

                        <Box display="flex" gap={0.5} className="comment-actions" sx={{
                            opacity: anchorElMap[c.id] ? 1 : 0, transition: 'opacity 0.2s', alignItems: 'center', '&:hover': { opacity: 1 }, '.comment-container:hover &': { opacity: 1 },
                        }}>
                            <Tooltip title="답글">
                                <IconButton
                                    size="small"
                                    sx={{
                                        padding: 0.5,
                                        width: 28,
                                        height: 28,
                                    }}
                                    onClick={() =>
                                        setReplyFormMap((prev) => {
                                            const isVisible = prev[c.id];
                                            const newMap = { ...prev, [c.id]: !isVisible };

                                            if (isVisible) {
                                                setReplyCommentMap((prev) => {
                                                    const updated = { ...prev };
                                                    delete updated[c.id];
                                                    return updated;
                                                });
                                            }

                                            return newMap;
                                        })
                                    }
                                >
                                    <ReplyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            {isOwn && !isEditing && !c.is_deleted && (
                                <>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            padding: 0.5,
                                            width: 28,
                                            height: 28,
                                        }}
                                        onClick={(e) =>
                                            setAnchorElMap((prev) => ({ ...prev, [c.id]: e.currentTarget }))
                                        }
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>

                                    <Menu
                                        anchorEl={anchorElMap[c.id]}
                                        open={Boolean(anchorElMap[c.id])}
                                        onClose={() =>
                                            setAnchorElMap((prev) => ({ ...prev, [c.id]: null }))
                                        }
                                    >
                                        <MenuItem
                                            onClick={() => {
                                                setEditingCommentId(c.id);
                                                setEditCommentMap({ ...editCommentMap, [c.id]: c.comment });
                                                setAnchorElMap((prev) => ({ ...prev, [c.id]: null }));
                                            }}
                                        >
                                            <EditIcon />
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                setReplyTarget(c.id);
                                                setCommentDialog(true);
                                                setAnchorElMap((prev) => ({ ...prev, [c.id]: null }));
                                            }}
                                        >
                                            <DeleteIcon />
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* 답글 작성 폼 */}
                    {isReplyVisible && (
                        <Box display="flex" alignItems="center" mt={1} gap={1}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="답글을 입력하세요"
                                value={replyCommentMap[c.id] || ''}
                                onChange={(e) => setReplyCommentMap({ ...replyCommentMap, [c.id]: e.target.value })}
                            />
                            <Button variant="contained" size="small" onClick={() => handleAddComment(c.id)}>
                                등록
                            </Button>
                        </Box>
                    )}

                    {/* 대댓글 렌더링 */}
                    {c.replies && c.replies.length > 0 && (
                        <>
                            {shouldHideReplies ? (
                                <Button
                                    size="small"
                                    sx={{ mt: 1, fontSize: '0.8rem' }}
                                    onClick={() =>
                                        setExpandedCommentIds((prev) => ({ ...prev, [c.id]: true }))
                                    }
                                >
                                    + 답글 {c.replies.length}개 보기
                                </Button>
                            ) : (
                                <Box mt={1}>
                                    {renderComments(c.replies, depth + 1)}
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            );
        });
    };

    const handleAddComment = (parentId = null) => {
        const content = parentId ? replyCommentMap[parentId] : newComment;

        if (!content.trim()) {
            setSnackbarMessage('댓글 내용을 입력해주세요.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        fetch(`http://localhost:3005/comments/${selectedDiary.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ email, comment: content, parentId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNewComment('');
                    setReplyFormMap(prev => ({ ...prev, [parentId]: false }));
                    setReplyCommentMap((prev) => ({ ...prev, [parentId]: '' }));
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
        const content = editCommentMap[commentId];

        if (!content.trim()) {
            setSnackbarMessage('수정할 댓글 내용을 입력해주세요.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        fetch(`http://localhost:3005/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ comment: content })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEditingCommentId(null);
                    setEditCommentMap(prev => {
                        const newMap = { ...prev };
                        delete newMap[commentId];
                        return newMap;
                    });
                    handleOpen(selectedDiary); // 댓글 목록 갱신
                    setSnackbarMessage('댓글이 수정되었습니다.');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                } else {
                    console.error('댓글 수정 실패:', data.message);
                }
            })
            .catch(err => console.error('댓글 수정 오류:', err));
    };

    const handleDeleteComment = (commentId) => {
        fetch(`http://localhost:3005/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    handleOpen(selectedDiary);
                    setCommentDialog(false);
                    setSnackbarMessage('댓글이 삭제되었습니다.');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                } else {
                    console.error('댓글 삭제 실패:', data.message);
                    setSnackbarMessage(data.message || '댓글 삭제에 실패했습니다.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                }
            })
            .catch(err => {
                console.error('댓글 삭제 오류:', err);
                setSnackbarMessage('서버 오류가 발생했습니다.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
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
                        {isOwner && (
                            <>
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
                            </>
                        )}
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
                                    height: 480,
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

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle1" sx={{ mb: 1 }}>댓글</Typography>
                            <Box
                                sx={{
                                    height: '1px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    mb: 1,
                                }}
                            />
                            <Box sx={{ maxHeight: 280, overflowY: 'auto', }}>
                                {renderComments(comments)}
                            </Box>
                            <CencelConfirm
                                open={commentDialog}
                                onClose={() => setCommentDialog(false)}
                                onConfirm={() => handleDeleteComment(replyTarget)}
                                title="댓글 삭제"
                                content="댓글을 삭제"
                            />
                            <Box display="flex" alignItems="center" mt={2} gap={1}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="댓글을 입력하세요"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button variant="contained" onClick={() => handleAddComment()}>
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
