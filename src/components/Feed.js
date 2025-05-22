import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Tabs, Tab, Card, CardMedia, CardContent, MenuItem,
    IconButton, Avatar, Alert, Snackbar, Button, TextField, Divider,
    DialogContent, DialogTitle, Dialog, Menu, Tooltip
} from '@mui/material';
import {
    ArrowBackIosNew, ArrowForwardIos, Delete, Edit, Close, MoreVert, Reply
} from '@mui/icons-material';
import CencelConfirm from './CencelConfirm';
import { getToken, isLoggedIn, logout, isTokenExpired } from '../utils/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import AddButton from './AddButton';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import 'dayjs/locale/ko'

dayjs.locale('ko');

const emotionTags = [
    { value: 'happy', label: '기쁨' },
    { value: 'sad', label: '슬픔' },
    { value: 'angry', label: '화남' },
    { value: 'excited', label: '신남' },
    { value: 'tired', label: '피곤' },
];

const emotionLabelMap = {
    happy: '기쁨',
    sad: '슬픔',
    angry: '화남',
    excited: '신남',
    tired: '피곤',
};

const Feed = () => {
    const today = dayjs();

    const [selectedDate, setSelectedDate] = useState(today.format('YYYY-MM-DD'));
    const [diaries, setDiaries] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [mediaList, setMediaList] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyCommentMap, setReplyCommentMap] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [editMemo, setEditMemo] = useState('');
    const [editEmotion, setEditEmotion] = useState('');
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
    const [dialogOpen, setDialogOpen] = useState(false);

    const weekDates = useMemo(() => {
        const startOfWeek = dayjs().add(weekOffset, 'week').startOf('week').add(1, 'day'); // 월요일 기준
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    }, [weekOffset]);

    const navigate = useNavigate();
    const location = useLocation();
    const openDiaryDate = location.state?.selectedDate;

    const token = getToken();
    const email = jwtDecode(token).email;

    const handleOpen = (diary) => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/detail/${diary.id}`)
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
        openDiary(selectedDate);
        setNewComment('');
        setReplyCommentMap({});
        setReplyFormMap({});
        setEditCommentMap({});
        setEditingCommentId(null);
        setReplyTarget(null);
    };

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
            fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/${selectedDiary.id}`, {
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
            fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/${selectedDiary.id}`, {
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
                                    <Reply fontSize="small" />
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
                                        <MoreVert fontSize="small" />
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
                                            <Edit />
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                setReplyTarget(c.id);
                                                setCommentDialog(true);
                                                setAnchorElMap((prev) => ({ ...prev, [c.id]: null }));
                                            }}
                                        >
                                            <Delete />
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

        fetch(`${process.env.REACT_APP_API_BASE_URL}/comments/${selectedDiary.id}`, {
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

        fetch(`${process.env.REACT_APP_API_BASE_URL}/comments/${commentId}`, {
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
        fetch(`${process.env.REACT_APP_API_BASE_URL}/comments/${commentId}`, {
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

    // const getProfileImageUrl = (path) => {
    //     if (!path) return '';
    //     const isFullUrl = /^https?:\/\//i.test(path);
    //     return isFullUrl ? path : `${process.env.REACT_APP_API_BASE_URL}/${path}`;
    // };

    const openDiary = useCallback((date) => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/all/${date}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const sortedDiaries = data.list.sort((a, b) => {
                        if (a.email === email && b.email !== email) return -1;
                        if (a.email !== email && b.email === email) return 1;
                        return 0;
                    });
                    setDiaries(sortedDiaries);
                } else {
                    console.error('다이어리 로딩 실패');
                }
            })
            .catch(err => console.error(err));
    }, [email, token]);

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

        if (!selectedDate) return;

        openDiary(selectedDate);

    }, [navigate, location, selectedDate, openDiary]);

    useEffect(() => {
        const selected = dayjs(selectedDate);
        const isInCurrentWeek = weekDates.some(d => d.isSame(selected, 'day'));
        if (!isInCurrentWeek) {
            setSelectedDate(weekDates[0].format('YYYY-MM-DD'));
        }
    }, [weekOffset, selectedDate, weekDates]);

    useEffect(() => {
        if (openDiaryDate) {
            fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/detail/${openDiaryDate}`)
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
    }, [openDiaryDate]);

    const isOwner = selectedDiary?.email === email;
    const isEditableTime = new Date() <= new Date(selectedDiary?.editable_until);
    const canEdit = isOwner && isEditableTime;

    return (
        <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto' }}>
            <Typography variant="h5" sx={{ textAlign: 'center' }} gutterBottom>일기 목록</Typography>

            <Box sx={{ width: '100%' }}>
                {/* 월 표시 및 좌우 아이콘 버튼 */}
                <Box display="flex" alignItems="center" justifyContent="center" mb={2} gap={1}>
                    <IconButton onClick={() => setWeekOffset(weekOffset - 1)} aria-label="이전 주">
                        <ArrowBackIosNew />
                    </IconButton>
                    <Typography variant="h6" sx={{ minWidth: 120, textAlign: 'center' }}>
                        {weekDates[0].format('YYYY년 MM월')}
                    </Typography>
                    <IconButton onClick={() => setWeekOffset(weekOffset + 1)} aria-label="다음 주">
                        <ArrowForwardIos />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {/* 날짜 탭 */}
                    <Tabs
                        value={selectedDate}
                        onChange={(_, newDate) => setSelectedDate(newDate)}
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                    >
                        {weekDates.map((dateObj) => {
                            const date = dateObj.format('YYYY-MM-DD');
                            const dayOfWeek = dateObj.day();

                            let dayColor = 'inherit';
                            if (dayOfWeek === 0) dayColor = 'red';
                            else if (dayOfWeek === 6) dayColor = 'blue';

                            return (
                                <Tab
                                    key={date}
                                    value={date}
                                    label={
                                        <Box textAlign="center">
                                            <Typography variant="body2" sx={{ color: dayColor }}>
                                                {dateObj.format('dd')}
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ color: dayColor }}>{dateObj.format('D')}</Typography>
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Box>
            </Box>

            {/* 선택한 날짜의 일기 목록 */}
            {
                diaries.length === 0 ? (
                    <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>이 날 작성된 일기가 없습니다.</Typography>
                ) : (
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        {diaries
                            .filter((diary) => {
                                // 비공개인 경우 작성자 본인만 볼 수 있음
                                return !diary.is_private || diary.email === email;
                            })
                            .map((diary) => (
                                <Card
                                    key={diary.id}
                                    sx={{ p: 1, display: 'flex', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                                    onClick={() => handleOpen(diary)}
                                >
                                    {/* 비공개 일기 표시 */}
                                    {diary.is_private === 1 && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: 'grey.300',
                                            px: 1,
                                            borderRadius: 1
                                        }}>
                                            <Typography variant="caption" color="textSecondary">비공개</Typography>
                                        </Box>
                                    )}
                                    <Box
                                        sx={{
                                            width: 160,
                                            height: 140,
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            m: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {/* 왼쪽 이미지 */}
                                        {diary.thumbnailPath?.endsWith('.mp4') ? (
                                            <CardMedia
                                                component="video"
                                                // src={`${process.env.REACT_APP_API_BASE_URL}/${diary.thumbnailPath}`}
                                                src={`${diary.thumbnailPath}`}
                                                autoPlay
                                                muted
                                                loop
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <CardMedia
                                                component="img"
                                                // src={`${process.env.REACT_APP_API_BASE_URL}/${diary.thumbnailPath}`}
                                                src={`${diary.thumbnailPath}`}
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <CardContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        {/* 작성자 정보 (프로필 이미지 + 닉네임) */}
                                        <Box display="flex" alignItems="center" mb={1} mt={4} gap={1}>
                                            <Avatar
                                                // src={getProfileImageUrl(diary.profile_image)}
                                                src={diary.profile_image}
                                                alt={diary.nickname}
                                                sx={{ width: 32, height: 32 }}
                                            />
                                            <Typography variant="subtitle2" noWrap>{diary.nickname}</Typography>
                                        </Box>

                                        {/* 내용 */}
                                        <Typography variant="body2" color="textSecondary" noWrap>{diary.emotion_tag}</Typography>
                                        <Typography variant="body1" noWrap sx={{ mt: 0.5 }}>
                                            {diary.memo}
                                        </Typography>

                                        {/* 작성 시간 - 오른쪽 하단 */}
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            sx={{ alignSelf: 'flex-end', mt: 1, mr: 1 }}
                                        >
                                            {new Date(diary.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                    </Box>
                )
            }
            {selectedDiary && (
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
                            <Close />
                        </IconButton>
                        <Box sx={{ position: 'absolute', top: 8, right: 50, display: 'flex', gap: 1 }}>
                            {canEdit && (!isEditMode ? (
                                <IconButton onClick={() => {
                                    setIsEditMode(true);
                                    setEditMemo(selectedDiary.memo);
                                    setEditEmotion(selectedDiary.emotion_tag);
                                }}>
                                    <Edit />
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
                                        <Delete />
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
                                    <ArrowBackIosNew />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleSlide('right')}
                                    disabled={currentIndex === mediaList.length - 1}
                                    sx={{ position: 'absolute', top: '45%', right: -20, zIndex: 2 }}
                                >
                                    <ArrowForwardIos />
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
                                                    // src={`${process.env.REACT_APP_API_BASE_URL}/${mediaList[currentIndex].mediaPath}`}
                                                    src={`${mediaList[currentIndex].mediaPath}`}
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
                                                        // src={`${process.env.REACT_APP_API_BASE_URL}/${mediaList[currentIndex].mediaPath}`}
                                                        src={`${mediaList[currentIndex].mediaPath}`}
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

                                <Typography variant="subtitle1" sx={{ mb: 1 }}>댓글</Typography>
                                <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
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
            )}
            <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <AddButton></AddButton>
        </Box >
    );
};

export default Feed;
