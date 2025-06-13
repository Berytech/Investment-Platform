import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    IconButton,
    CircularProgress,
    Avatar,
    Tooltip,
    InputAdornment
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { adminApi } from '../services/adminApi';
import NotificationSnackbar from './NotificationSnackbar';

const StartupManagement = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [startups, setStartups] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        logo: null
    });
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity
        });
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminApi.getAllEvents();
            setEvents(response || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            showNotification(error.response?.data?.message || 'Error fetching events', 'error');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const fetchStartups = useCallback(async () => {
        if (!selectedEvent) return;
        
        setLoading(true);
        try {
            const response = await adminApi.getStartupsByEvent(selectedEvent);
            setStartups(response || []);
        } catch (error) {
            console.error('Error fetching startups:', error);
            showNotification(error.response?.data?.message || 'Error fetching startups', 'error');
            setStartups([]);
        } finally {
            setLoading(false);
        }
    }, [selectedEvent, showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        if (selectedEvent) {
            fetchStartups();
        }
    }, [selectedEvent, fetchStartups]);

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    const handleLogoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, logo: file }));
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('eventId', selectedEvent);
            if (formData.logo) {
                formDataToSend.append('logo', formData.logo);
            }
            
            await adminApi.createStartup(formDataToSend);
            showNotification('Startup created successfully');
            setFormData({ name: '', logo: null });
            setPreviewUrl('');
            fetchStartups();
        } catch (error) {
            console.error('Error creating startup:', error);
            showNotification(
                error.response?.data?.message || 'Error creating startup',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this startup?')) return;
        
        setLoading(true);
        try {
            await adminApi.deleteStartup(id);
            showNotification('Startup deleted successfully');
            fetchStartups();
        } catch (error) {
            console.error('Error deleting startup:', error);
            showNotification(
                error.response?.data?.message || 'Error deleting startup',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <NotificationSnackbar
                open={notification.open}
                handleClose={handleCloseNotification}
                message={notification.message}
                severity={notification.severity}
            />
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                </Box>
            )}
            <Typography variant="h5" gutterBottom>
                Startup Management
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Select Event"
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                        >
                            {events && events.length > 0 ? (
                                events.map((event) => (
                                    <MenuItem key={event._id} value={event._id}>
                                        {event.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No events available</MenuItem>
                            )}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {selectedEvent && (
                <>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Startup Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            fullWidth
                                            sx={{ 
                                                height: '56px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            {previewUrl ? (
                                                <Avatar
                                                    src={previewUrl}
                                                    sx={{ width: 24, height: 24 }}
                                                    alt="Preview"
                                                />
                                            ) : null}
                                            {formData.logo ? 'Change Logo' : 'Upload Logo'}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                        </Button>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            {formData.logo ? formData.logo.name : 'Optional: Upload startup logo'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary"
                                        fullWidth
                                        sx={{ height: '56px' }}
                                    >
                                        Add Startup
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : startups && startups.length > 0 ? (
                                    startups.map((startup) => (
                                        <TableRow key={startup._id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={startup.logoUrl}
                                                        alt={startup.name}
                                                        sx={{ 
                                                            width: 40, 
                                                            height: 40,
                                                            bgcolor: startup.logoUrl ? 'transparent' : 'primary.main'
                                                        }}
                                                    >
                                                        {!startup.logoUrl && startup.name.charAt(0)}
                                                    </Avatar>
                                                    {startup.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleDelete(startup._id)} size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center">
                                            No startups found for this event
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default StartupManagement;
