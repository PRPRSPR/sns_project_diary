import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getToken, isLoggedIn } from '../utils/auth';
import {
    TextField, Button, MenuItem, Box, Typography, Stack, Checkbox,
    FormControlLabel, IconButton
} from '@mui/material';
import { ChevronLeft, ChevronRight, Delete, Star, StarBorder } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const emotionTags = ['happy', 'sad', 'angry', 'excited', 'tired'];

const DiaryCreate = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState();
    const [date, setDate] = useState(dayjs());
    const [emotion, setEmotion] = useState('');
    const [memo, setMemo] = useState('');
    const [files, setFiles] = useState([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const scrollRef = useRef(null);
    // 스크롤 끝에서 영상 및 사진 로딩으로 렉걸림.
    const scrollLeft = () => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        setTimeout(updateScrollButtons, 300);
    };

    const scrollRight = () => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        setTimeout(updateScrollButtons, 300);
    };

    const updateScrollButtons = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        const combined = [...files, ...newFiles];
        if (combined.length > 10) {
            alert('최대 10개의 파일만 업로드할 수 있습니다.');
            return;
        }
        setFiles(combined);
    };

    const handleRemoveFile = (index) => {
        const updated = [...files];
        updated.splice(index, 1);
        setFiles(updated);
        if (thumbnailIndex >= updated.length) {
            setThumbnailIndex(0);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const reordered = Array.from(files);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setFiles(reordered);

        if (result.source.index === thumbnailIndex) {
            setThumbnailIndex(result.destination.index);
        } else if (
            result.source.index < thumbnailIndex &&
            result.destination.index >= thumbnailIndex
        ) {
            setThumbnailIndex((prev) => prev - 1);
        } else if (
            result.source.index > thumbnailIndex &&
            result.destination.index <= thumbnailIndex
        ) {
            setThumbnailIndex((prev) => prev + 1);
        }
    };

    const handleSubmit = async () => {
        const diaryInfo = {
            email,
            date: date.format('YYYY-MM-DD'),
            emotion_tag: emotion,
            memo,
            is_private: isPrivate ? 1 : 0,
        };

        try {
            const res = await fetch('http://localhost:3005/diary/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(diaryInfo),
            });

            const data = await res.json();

            if (!data.success) {
                alert('일기 저장 실패: ' + data.message);
                return;
            }

            const diaryId = data.diaryId;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('media', file);
                formData.append('mediaType', file.type.startsWith('video') ? 'video' : 'image');
                formData.append('thumbnailYn', i === thumbnailIndex ? 'Y' : 'N');
                formData.append('order', i.toString());

                const mediaRes = await fetch('http://localhost:3005/media/upload/'+diaryId, {
                    method: 'POST',
                    body: formData,
                });

                const mediaData = await mediaRes.json();

                if (!mediaData.success) {
                    alert('미디어 저장 실패: ' + mediaData.message);
                    return;
                }
            }

            alert('일기 및 미디어 저장 완료!');
            // navigate('/', { state: { openDiaryId: diaryId } });
        } catch (err) {
            console.error('업로드 에러:', err);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/login');
            return;
        }

        const token = getToken();
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setEmail(decoded.email);
            } catch (err) {
                console.error('토큰 디코드 실패:', err);
            }
        }
    }, [navigate]);

    useEffect(() => {
        updateScrollButtons();
    }, [files]);

    return (
        <Box maxWidth="sm" mx="auto" mt={4} p={2} border={1} borderRadius={2}>
            <Typography variant="h5" gutterBottom>일기 작성하기</Typography>
            <Stack spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="날짜"
                        value={date}
                        onChange={(newDate) => {
                            if (newDate) setDate(newDate);
                        }}
                        format="YYYY/MM/DD"
                        disableFuture
                    />
                </LocalizationProvider>

                <TextField
                    select
                    label="감정 태그"
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    fullWidth
                >
                    {emotionTags.map(tag => (
                        <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="내용"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                        />
                    }
                    label="비공개로 설정"
                />

                <Button variant="outlined" component="label">
                    미디어 업로드
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        onChange={handleFileChange}
                    />
                </Button>

                {files.length > 0 && (
                    <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <Typography variant="subtitle2">미디어 순서 및 썸네일 선택:</Typography>
                        <Box display="flex" alignItems="center">
                            <IconButton
                                onClick={scrollLeft}
                                disabled={!canScrollLeft}
                                sx={{ opacity: canScrollLeft ? 1 : 0.3 }}
                            >
                                <ChevronLeft />
                            </IconButton>

                            <Box
                                ref={scrollRef}
                                onScroll={updateScrollButtons}
                                sx={{
                                    overflowX: 'auto',
                                    maxWidth: '100%',
                                    whiteSpace: 'nowrap',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    mx: 1,
                                }}
                            >
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="media-list" direction="horizontal">
                                        {(provided) => (
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{ width: 'max-content' }}
                                            >
                                                {files.map((file, index) => (
                                                    <Draggable key={index} draggableId={`file-${index}`} index={index}>
                                                        {(provided) => (
                                                            <Box
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                border={1}
                                                                p={1}
                                                                width={120}
                                                                flexShrink={0}
                                                                position="relative"
                                                            >
                                                                {file.type.startsWith('image') ? (
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt="preview"
                                                                        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <video
                                                                        src={URL.createObjectURL(file)}
                                                                        controls
                                                                        style={{ width: '100%', height: 'auto' }}
                                                                    />
                                                                )}
                                                                <Typography
                                                                    variant="caption"
                                                                    noWrap
                                                                    title={file.name}
                                                                    sx={{
                                                                        display: 'block',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        maxWidth: '100%',
                                                                    }}
                                                                >
                                                                    {file.name}
                                                                </Typography>
                                                                <Box display="flex" justifyContent="space-between" mt={1}>
                                                                    <IconButton
                                                                        onClick={() => setThumbnailIndex(index)}
                                                                        size="small"
                                                                    >
                                                                        {thumbnailIndex === index ? <Star /> : <StarBorder />}
                                                                    </IconButton>
                                                                    <IconButton
                                                                        onClick={() => handleRemoveFile(index)}
                                                                        size="small"
                                                                    >
                                                                        <Delete />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </Stack>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </Box>

                            <IconButton
                                onClick={scrollRight}
                                disabled={!canScrollRight}
                                sx={{ opacity: canScrollRight ? 1 : 0.3 }}
                            >
                                <ChevronRight />
                            </IconButton>
                        </Box>
                    </Box>
                )}

                <Button variant="contained" onClick={handleSubmit}>저장</Button>
            </Stack>
        </Box>
    );
};

export default DiaryCreate;
