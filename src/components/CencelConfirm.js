import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const CancelConfirmDialog = ({ open, onClose, onConfirm, title, content }) => {
  const isDelete = content === '친구를 삭제';
  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>정말 {content}하시겠습니까?</Typography>
        {isDelete && (
          <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-line' }}>
            {`삭제 시 친구도 '삭제된 친구'임을 확인할 수 있으며,
              해당 친구의 일기나 활동을 더 이상 볼 수 없게 됩니다.
              삭제한 친구 또한 당신의 일기나 활동을 볼 수 없습니다.`}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">아니요</Button>
        <Button onClick={onConfirm} color="error" variant="contained">네</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelConfirmDialog;
