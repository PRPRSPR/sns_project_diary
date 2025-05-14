import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    Badge,
    CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';

const ConversationListPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = getToken();
    const myEmail = jwtDecode(token).email;

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }

        fetch(`http://localhost:3005/messages/convers/${myEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConversations(data.conversations);
                    console.log(data);
                }
            })
            .catch(err => console.error('대화 목록 불러오기 오류:', err))
            .finally(() => setLoading(false));
    }, [myEmail, token, navigate]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (conversations.length === 0) {
        return (
            <Typography align="center" mt={4}>
                아직 대화한 친구가 없습니다.
            </Typography>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" mt={3}>
            <Typography variant="h5" gutterBottom>
                대화 목록
            </Typography>
            <List>
                {conversations.map((conv, idx) => {
                    const otherEmail = conv.other_email;
                    const otherNickname = conv.other_nickname;
                    const otherProfile = conv.other_profile;
                    const unread = conv.unread_count > 0;

                    const messagePreview = conv.media_type
                        ? conv.media_type === 'image'
                            ? '[사진]'
                            : conv.media_type === 'video'
                                ? '[영상]'
                                : '[파일]'
                        : conv.content;

                    return (
                        <div key={idx}>
                            <ListItem button onClick={() => navigate(`/message/${otherEmail}`)}>
                                <ListItemAvatar>
                                    <Badge
                                        color="error"
                                        badgeContent={conv.unread_count}
                                        invisible={!unread}
                                        overlap="circular"
                                    >
                                        <Avatar
                                            src={
                                                /^https?:\/\//.test(otherProfile)
                                                    ? otherProfile
                                                    : `http://localhost:3005/${otherProfile}`
                                            }
                                        />
                                    </Badge>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={
                                        <Typography fontWeight={unread ? 'bold' : 'normal'}>
                                            {otherNickname}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            noWrap
                                            variant="body2"
                                            color="textSecondary"
                                            fontWeight={unread ? 'bold' : 'normal'}
                                        >
                                            {messagePreview}
                                        </Typography>
                                    }
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                                    {new Date(conv.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Typography>
                            </ListItem>
                            {idx !== conversations.length - 1 && <Divider />}
                        </div>
                    );
                })}
            </List>
        </Box>
    );
};

export default ConversationListPage;
