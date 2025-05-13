import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Paper,
    Avatar,
    InputAdornment,
    Stack,
    Chip,
    Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import CancelIcon from '@mui/icons-material/Cancel';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const MessagePage = () => {
    const navigate = useNavigate();
    const { email } = useParams();
    const [friend, setFriend] = useState([]);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const scrollRef = useRef(null);

    const token = getToken();
    const myEmail = jwtDecode(token).email;

    const fetchMessages = useCallback(() => {
        fetch(`http://localhost:3005/messages/${email}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    console.log(data);
                    setMessages(data.messages);
                    fetch(`http://localhost:3005/user/friends/${email}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                setFriend(data.user);
                            }
                        })
                }
            });
    }, [email, token]);

    const handleSend = () => {
        if (!content.trim() && !file) return;

        const formData = new FormData();
        formData.append('senderEmail', myEmail);
        formData.append('receiverEmail', email);
        formData.append('content', content);
        if (file) formData.append('media', file);

        fetch('http://localhost:3005/messages/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setContent('');
                    setFile(null);
                    fetchMessages();
                }
            });
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }
        fetchMessages();
    }, [fetchMessages, navigate]);

    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        };

        // 1. 기본 스크롤
        requestAnimationFrame(scrollToBottom);

        // 2. 이미지나 영상이 로드된 후에도 스크롤
        const mediaElements = scrollRef.current?.querySelectorAll('img, video');
        let loadedCount = 0;

        if (mediaElements.length === 0) return;

        mediaElements.forEach(el => {
            el.addEventListener('load', () => {
                loadedCount++;
                if (loadedCount === mediaElements.length) {
                    scrollToBottom();
                }
            });
            el.addEventListener('loadeddata', () => {
                loadedCount++;
                if (loadedCount === mediaElements.length) {
                    scrollToBottom();
                }
            });
        });

        return () => {
            mediaElements.forEach(el => {
                el.removeEventListener('load', scrollToBottom);
                el.removeEventListener('loadeddata', scrollToBottom);
            });
        };
    }, [messages]);

    return (
        <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                    src={
                        friend.profile_image?.startsWith('http')
                            ? friend.profile_image
                            : `http://localhost:3005/${friend.profile_image}`
                    }
                    alt={friend.nickname}
                    sx={{ width: 48, height: 48 }}
                />
                <Typography variant="h5">
                    {friend.nickname}
                </Typography>
            </Box>

            <Paper
                elevation={3}
                sx={{
                    border: '1px solid #ccc',
                    borderRadius: 2,
                    padding: 2,
                    height: 600,
                    overflowY: 'auto',
                    backgroundColor: '#f9f9f9',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#aaa',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#eee',
                    },
                }}
                ref={scrollRef}
            >
                {messages.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 3, fontSize: 18 }}>
                        아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_email === myEmail;
                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: isMe ? '#1976d2' : '#e0e0e0',
                                        color: isMe ? 'white' : 'black',
                                        ml: isMe ? 'auto' : 0,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}> {/* 줄바꿈 - whiteSpace */}
                                        {msg.content}
                                    </Typography>

                                    {msg.media_url && (
                                        <Box mt={1}>
                                            {msg.media_type === 'image' ? (
                                                <img
                                                    src={/^https?:\/\//.test(msg.media_url)
                                                        ? msg.media_url
                                                        : `http://localhost:3005/${msg.media_url}`}
                                                    alt="보낸 이미지"
                                                    style={{ maxWidth: '100%', borderRadius: 4 }}
                                                />
                                            ) : msg.media_type === 'video' ? (
                                                <video
                                                    src={/^https?:\/\//.test(msg.media_url)
                                                        ? msg.media_url
                                                        : `http://localhost:3005/${msg.media_url}`}
                                                    controls
                                                    style={{ maxWidth: '100%', borderRadius: 4 }}
                                                />
                                            ) : (
                                                <a
                                                    href={
                                                        /^https?:\/\//.test(msg.media_url)
                                                            ? msg.media_url
                                                            : `http://localhost:3005/${msg.media_url}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: isMe ? 'lightblue' : 'blue' }}
                                                >
                                                    파일 보기
                                                </a>
                                            )}
                                        </Box>
                                    )}

                                    <Typography
                                        variant="caption"
                                        sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
                                    >
                                        {new Date(msg.created_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Paper>

            {file && (
                <Box display="flex" alignItems="center" gap={1} sx={{ pl: 1, margin: 2 }}>
                    {file.type.startsWith('image/') && (
                        <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: 4 }}
                        />
                    )}
                    {file.type.startsWith('video/') && (
                        <video
                            src={URL.createObjectURL(file)}
                            controls
                            style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: 4 }}
                        />
                    )}
                    {!file.type.startsWith('image/') && !file.type.startsWith('video/') && (
                        <Chip label={file.name} variant="outlined" />
                    )}
                    <IconButton onClick={() => setFile(null)} size="small">
                        <CancelIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Box display="flex" alignItems="center" gap={1} mt={3}>
                <TextField
                    fullWidth
                    multiline
                    variant="outlined"
                    placeholder="메시지 입력..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault(); // 줄바꿈 방지
                            handleSend(); // 메시지 전송 함수 호출
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton component="label">
                                    <ImageIcon />
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        hidden
                                        onChange={e => setFile(e.target.files[0])}
                                    />
                                </IconButton>
                                <Divider sx={{ height: 28, m: 1, mr: 2 }} orientation="vertical" />
                                <IconButton color="primary" onClick={handleSend}>
                                    <SendIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
};

export default MessagePage;