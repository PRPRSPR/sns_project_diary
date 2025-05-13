import {
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    Divider,
    Paper,
    Box,
    CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';

const ConversationListPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = getToken();
    const myEmail = jwtDecode(token).email;

    useEffect(() => {
        fetch('http://localhost:3005/messages/conversations', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConversations(data.conversations);
                }
            })
            .catch(err => console.error('대화 목록 불러오기 오류:', err))
            .finally(() => setLoading(false));
    }, [token]);

    const renderLastMessage = (message, mediaType) => {
        if (message) return message;
        if (mediaType === 'image') return '[사진]';
        if (mediaType === 'video') return '[영상]';
        if (mediaType) return '[파일]';
        return '';
    };

    return (
        <Paper sx={{ maxWidth: 600, margin: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h5" gutterBottom>메시지</Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
            ) : conversations.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
                    아직 시작된 대화가 없습니다.
                </Typography>
            ) : (
                <List>
                    {conversations.map((conv, index) => (
                        <div key={conv.email}>
                            <ListItem button onClick={() => navigate(`/messages/${conv.email}`)}>
                                <ListItemAvatar>
                                    <Avatar src={`http://localhost:3005/${conv.profile_image}`} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={conv.nickname}
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {renderLastMessage(conv.last_message, conv.last_media_type)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(conv.last_time).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                            {index !== conversations.length - 1 && <Divider />}
                        </div>
                    ))}
                </List>
            )}
        </Paper>
    );
};

export default ConversationListPage;
