import React, { useEffect, useState } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { getToken, isLoggedIn } from '../utils/auth';

const Home = () => {
    const navigate = useNavigate();
    const [diaries, setDiaries] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [comments, setComments] = useState([]);
    const [mediaList, setMediaList] = useState([]);
    const [newComment, setNewComment] = useState('');

    const handleOpen = (diary) => {
        fetch(`http://localhost:3005/diary/detail/${diary.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
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

        // 중단점
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
        if (!isLoggedIn()) {
            navigate('/login');
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
                }
            })
            .catch(err => console.error(err));
    }, [navigate]);

    return (
        <div style={{ padding: '32px' }}>
            <Typography variant="h5" gutterBottom>
                내 달력
            </Typography>

            <Grid container spacing={3}>
                {diaries.map((diary) => (
                    <Grid item xs={12} sm={6} md={4} key={diary.id}>
                        <Card elevation={3} sx={{ borderRadius: 3, cursor: 'pointer' }} onClick={() => handleOpen(diary)}>
                            <CardMedia
                                component="img"
                                height="180"
                                image={diary.thumbnailPath}
                                alt="썸네일"
                            />
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                    {diary.emotion_tag}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {diary.memo?.slice(0, 50)}...
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
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
                        }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6">{selectedDiary?.emotion_tag}</Typography>
                    <Typography variant="body2">{selectedDiary?.memo}</Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1">첨부 미디어</Typography>
                    <Grid container spacing={2}>
                        {mediaList.map((media) => (
                            <Grid item xs={6} key={media.id}>
                                {media.mediaType === 'image' ? (
                                    <img src={media.mediaPath} alt="media" style={{ width: '100%' }} />
                                ) : (
                                    <video controls style={{ width: '100%' }}>
                                        <source src={media.mediaPath} type="video/mp4" />
                                    </video>
                                )}
                            </Grid>
                        ))}
                    </Grid>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1">댓글</Typography>

                    <List>
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
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Home;
