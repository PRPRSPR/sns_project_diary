import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getToken, isLoggedIn } from '../utils/auth';
import {
    TextField, Button, MenuItem, Box, Typography, Stack, Checkbox,
    FormControlLabel, IconButton, Snackbar, Alert
} from '@mui/material';
import { ChevronLeft, ChevronRight, Delete, Star, StarBorder, ArrowBackIosNew } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const emotionTags = [
    { value: 'happy', label: '기쁨' },
    { value: 'sad', label: '슬픔' },
    { value: 'angry', label: '화남' },
    { value: 'excited', label: '신남' },
    { value: 'tired', label: '피곤' },
];

const DiaryCreate = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState(dayjs());
    const [emotion, setEmotion] = useState('');
    const [memo, setMemo] = useState('');
    const [files, setFiles] = useState([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');
    const [disabledDates, setDisabledDates] = useState([]);

    const token = getToken();
    const myEmail = jwtDecode(token).email;

    const scrollRef = useRef(null);
    const location = useLocation();
    const returnType = location.state?.returnType || 'home';
    const from = location.state?.from || '/home';

    const showSnackbar = (message, severity = 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

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
            showSnackbar('최대 10개의 파일만 업로드할 수 있습니다.', 'warning');
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
        if (files.length === 0) {
            showSnackbar('최소 하나의 미디어를 업로드해야 합니다.', 'warning');
            return;
        }
        const diaryInfo = {
            email: myEmail,
            date: date.format('YYYY-MM-DD'),
            emotion_tag: emotion,
            memo,
            is_private: isPrivate ? 1 : 0,
        };

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(diaryInfo),
            });

            const data = await res.json();

            if (!data.success) {
                showSnackbar('일기 저장 실패: ' + data.message, 'error');
                return;
            }

            const diaryId = data.diaryId;
            const selectedDate = date.format('YYYY-MM-DD');

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('media', file);
                formData.append('mediaType', file.type.startsWith('video') ? 'video' : 'image');
                formData.append('thumbnailYn', i === thumbnailIndex ? 'Y' : 'N');
                formData.append('order', i.toString());

                const mediaRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/media/upload/${diaryId}`, {
                    method: 'POST',
                    body: formData,
                });

                const mediaData = await mediaRes.json();

                if (!mediaData.success) {
                    showSnackbar('미디어 저장 실패: ' + mediaData.message, 'error');
                    return;
                }
            }

            showSnackbar('일기 및 미디어 저장 완료!', 'success');
            setTimeout(() => {
                if (returnType === 'home') {
                    navigate(from, { state: { openDiaryId: diaryId } });
                } else if (returnType === 'feed') {
                    navigate(from, { state: { selectedDate } });
                }
            }, 1000);
        } catch (err) {
            console.error('업로드 에러:', err);
            showSnackbar('저장 중 오류가 발생했습니다.', 'error');
        }
    };

    const fetchDisabledDates = useCallback(() => {
        if (!myEmail) return;
        fetch(`${process.env.REACT_APP_API_BASE_URL}/diary/date/${myEmail}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDisabledDates(data.dates);
                } else {
                    console.error('서버 응답 실패:', data.message);
                }
            })
            .catch(err => console.error('fetch 에러:', err));
    }, [myEmail]);

    const isDateDisabled = useCallback((targetDate) => {
        const result = disabledDates.some(disabled =>
            dayjs(disabled).isSame(targetDate, 'day')
        );
        return result;
    }, [disabledDates]);

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }

        fetchDisabledDates();

    }, [navigate, fetchDisabledDates]);

    useEffect(() => {
        updateScrollButtons();
    }, [files]);

    useEffect(() => {
        if (!date || !disabledDates.length) return;

        if (isDateDisabled(date)) {
            // 과거로 가능한 날짜 찾기
            let offset = 1;
            let candidate = dayjs().subtract(offset, 'day');

            while (
                isDateDisabled(candidate) &&
                offset < 365
            ) {
                offset++;
                candidate = dayjs().subtract(offset, 'day');
            }

            setDate(candidate);
            showSnackbar('이미 일기를 작성한 날짜여서 다른 날짜로 자동 이동했습니다.');
        }
    }, [date, disabledDates, isDateDisabled]);

    const isSelectedDateDisabled = date && isDateDisabled(date);

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2}>
                <IconButton size='large' onClick={() => navigate('/home')}>
                    <ArrowBackIosNew fontSize='large' />
                </IconButton>
                <Typography variant="h5">일기 작성하기</Typography>
            </Box>
            <Box maxWidth="sm" mx="auto" mt={4} p={2} border={1} borderRadius={2}>
                <Stack sx={{ mt: 4 }} spacing={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="날짜"
                            value={date}
                            onChange={(newDate) => {
                                if (newDate) setDate(newDate);
                            }}
                            format="YYYY/MM/DD"
                            shouldDisableDate={isDateDisabled}
                            disableFuture
                            error={isSelectedDateDisabled}
                            helperText={
                                isSelectedDateDisabled ? '해당 날짜는 이미 일기가 작성되어 다른 날짜로 자동 이동되었습니다.' : ''
                            }
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
                            <MenuItem key={tag.value} value={tag.value}>{tag.label}</MenuItem>
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
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DiaryCreate;
