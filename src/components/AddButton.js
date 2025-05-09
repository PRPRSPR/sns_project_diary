import React from 'react';
import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const AddButton = () => {
    const navigate = useNavigate();

    return (
        <div>
            <Fab
                color="primary"
                aria-label="add"
                onClick={() => navigate('/create')}
                sx={{ position: 'fixed', bottom: 24, right: 24 }}
            >
                <AddIcon />
            </Fab>
        </div>
    );
};

export default AddButton;