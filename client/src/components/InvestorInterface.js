import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    CircularProgress,
    Alert,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    useMediaQuery,
    Stack,
    Avatar,
    Tooltip
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { adminApi, getImageUrl } from '../services/adminApi';

const InvestorInterface = () => {
    const { eventId, investorId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [investor, setInvestor] = useState(null);
    const [startups, setStartups] = useState([]);
    const [investments, setInvestments] = useState({});
    const [historyDialog, setHistoryDialog] = useState({
        open: false,
        loading: false,
        data: null,
        error: null
    });
    const [notification, setNotification] = useState({
        message: '',
        severity: 'success',
        open: false
    });

    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({
            message,
            severity,
            open: true
        });
    }, []);

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [investorData, startupsData] = await Promise.all([
                adminApi.getInvestorDetails(investorId),
                adminApi.getStartupsByEvent(eventId)
            ]);
            setInvestor(investorData);
            // Sort startups alphabetically by name
            const sortedStartups = [...startupsData].sort((a, b) => 
                a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
            setStartups(sortedStartups);

            // Initialize investments state with existing investments
            const investmentsMap = {};
            if (investorData.investments) {
                investorData.investments.forEach(inv => {
                    investmentsMap[inv.startupId] = inv.amount;
                });
            }
            setInvestments(investmentsMap);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.message || 'Error loading investor interface');
        } finally {
            setLoading(false);
        }
    }, [eventId, investorId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInvestmentChange = (startupId, value) => {
        const amount = Number(value) || 0;
        if (amount < 0) return;
        
        // Get the existing investment for this startup
        const existingInvestment = investor?.investments?.find(
            inv => inv.startupId === startupId
        );
        const existingAmount = existingInvestment?.amount || 0;
        
        // Calculate total of other investments (excluding this startup)
        const otherInvestments = Object.entries(investments)
            .filter(([id]) => id !== startupId)
            .reduce((sum, [_, amount]) => sum + Number(amount), 0);
            
        // Calculate new total including this investment
        const totalWithNew = amount ;
        console.log('Total with new investment:', totalWithNew);
        console.log('availableBudget:', investor.remainingBudget + existingAmount);
        // Calculate available budget (remaining + current investment in this startup)
        const availableBudget = investor.event?.totalBudgetPerInvestor - otherInvestments + existingAmount;

        if (totalWithNew > availableBudget ) {
            showNotification(`Cannot exceed available budget of $${availableBudget.toLocaleString()}`, 'error');
            return;
        }

        setInvestments(prev => ({
            ...prev,
            [startupId]: amount
        }));
    };

    const calculateTotalInvestment = () => {
        return Object.values(investments).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
    };

    const handleSubmitInvestment = async (startupId) => {
        const amount = investments[startupId] || 0;
        if (amount <= 0) return;

        try {
            setLoading(true);
            await adminApi.createInvestment({
                investorId,
                startupId,
                amount
            });
            showNotification('Investment submitted successfully!', 'success');
            await fetchData(); // Refresh data
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error submitting investment', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (investmentId) => {
        setHistoryDialog(prev => ({ ...prev, open: true, loading: true, error: null }));
        try {
            const history = await adminApi.getInvestmentHistory(investmentId);
            setHistoryDialog(prev => ({ ...prev, loading: false, data: history }));
        } catch (error) {
            setHistoryDialog(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.message || 'Error loading investment history'
            }));
        }
    };

    const handleCloseHistory = () => {
        setHistoryDialog({
            open: false,
            loading: false,
            data: null,
            error: null
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            p: { xs: 1, sm: 2, md: 3 },
            maxWidth: '100%',
            margin: '0 auto'
        }}>
            <Paper sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 3,
                width: '100%',
                maxWidth: '100%'
            }}>
                <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    gutterBottom
                    sx={{ wordBreak: 'break-word' }}
                >
                    Welcome, {investor?.name}
                </Typography>
                <Typography 
                    variant={isMobile ? "body1" : "h6"} 
                    color="text.secondary" 
                    gutterBottom
                >
                    {investor?.event?.name}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack 
                    direction={isMobile ? "column" : "row"} 
                    spacing={2} 
                    divider={isMobile ? <Divider flexItem /> : null}
                    sx={{
                        width: '100%',
                        textAlign: { xs: 'center', sm: 'left' }
                    }}
                >
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Initial Budget:
                        </Typography>
                        <Typography variant={isMobile ? "h6" : "h5"} color="primary">
                            ${investor?.event?.totalBudgetPerInvestor}
                        </Typography>
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Remaining Budget:
                        </Typography>
                        <Typography variant={isMobile ? "h6" : "h5"} color="success.main">
                            ${investor?.remainingBudget}
                        </Typography>
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Total Allocated:
                        </Typography>
                        <Typography variant={isMobile ? "h6" : "h5"} color="secondary.main">
                            ${calculateTotalInvestment()}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            <Typography 
                variant={isMobile ? "h6" : "h5"} 
                gutterBottom 
                align="center"
                sx={{ mb: 3 }}
            >
                Available Startups
            </Typography>

            <Grid 
                container 
                spacing={2} 
                justifyContent="center"
                sx={{ 
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0,
                    padding: 0
                }}
            >
                {startups.map((startup) => {
                    const currentInvestment = investments[startup._id] || 0;
                    const existingInvestment = investor?.investments?.find(
                        inv => inv.startupId === startup._id
                    );
                    const existingAmount = existingInvestment?.amount || 0;

                    return (
                        <Grid item xs={12} key={startup._id} sx={{ width: '100%', px: { xs: 0, sm: 1 } }}>
                            <Card sx={{ 
                                width: '100%',
                                maxWidth: '100%',
                                boxShadow: { xs: 'none', sm: 1 },
                                border: { xs: 1, sm: 0 },
                                borderColor: 'divider',
                                '&:hover': {
                                    boxShadow: { xs: 0, sm: 3 },
                                    transition: 'box-shadow 0.3s ease-in-out'
                                }
                            }}>
                                <CardContent sx={{ 
                                    width: '100%',
                                    p: { xs: 1.5, sm: 2 }
                                }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <Tooltip 
                                            title={startup.logoUrl ? 
                                                <Box
                                                    component="img"
                                                    src={getImageUrl(startup.logoUrl)}
                                                    alt={startup.name}
                                                    sx={{
                                                        width: 150,
                                                        height: 150,
                                                        objectFit: 'contain',
                                                        background: '#fff',
                                                        p: 1,
                                                        borderRadius: 1
                                                    }}
                                                    onError={(e) => {
                                                        console.error('Error loading image:', startup.logoUrl);
                                                        e.target.src = ''; // Clear the src to show the fallback
                                                    }}
                                            /> : 
                                                "No logo available"
                                            }
                                            placement="right"
                                            arrow
                                        >
                                            <Avatar 
                                                src={getImageUrl(startup.logoUrl)}
                                                alt={startup.name}
                                                sx={{ 
                                                    width: { xs: 48, sm: 56 }, 
                                                    height: { xs: 48, sm: 56 }, 
                                                    mr: 2,
                                                    border: '2px solid',
                                                    borderColor: 'primary.main',
                                                    bgcolor: startup.logoUrl ? 'background.paper' : theme.palette.primary.main,
                                                    fontSize: { xs: '1.2rem', sm: '1.4rem' }
                                                }} 
                                            >
                                                {!startup.logoUrl && startup.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant={isMobile ? "body1" : "h6"}>
                                                {startup.name}
                                            </Typography>
                                            {existingAmount > 0 && (
                                                <Typography 
                                                    variant={isMobile ? "caption" : "body2"} 
                                                    color="text.secondary" 
                                                    gutterBottom
                                                >
                                                    Current Investment: ${existingAmount}
                                                </Typography>
                                            )}
                                        </Box>
                                        {existingInvestment && (
                                            <IconButton 
                                                size={isMobile ? "small" : "medium"}
                                                onClick={() => handleViewHistory(existingInvestment._id)}
                                                title="View History"
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <TextField
                                        fullWidth
                                        label="Investment Amount"
                                        type="number"
                                        value={currentInvestment}
                                        onChange={(e) => handleInvestmentChange(startup._id, e.target.value)}
                                        InputProps={{
                                            inputProps: { 
                                                min: 0,
                                                max: investor?.remainingBudget+ existingAmount,
                                                inputMode: 'decimal', // Better for mobile numeric input
                                                pattern: '[0-9]*' // For iOS numeric keyboard
                                            }
                                        }}
                                        helperText={`Maximum: $${investor?.remainingBudget +existingAmount }`}
                                        sx={{ mt: 2 }}
                                        size={isMobile ? "small" : "medium"}
                                    />
                                </CardContent>
                                <CardActions>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => handleSubmitInvestment(startup._id)}
                                        disabled={currentInvestment === existingAmount || currentInvestment <= 0}
                                        size={isMobile ? "small" : "medium"}
                                    >
                                        {existingAmount >= 0 ? 'Update Investment' : 'Invest'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
            
            <Dialog 
                open={historyDialog.open} 
                onClose={handleCloseHistory}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        Investment History
                        {isMobile && (
                            <Button onClick={handleCloseHistory} color="inherit">
                                Close
                            </Button>
                        )}
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {historyDialog.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : historyDialog.error ? (
                        <Alert severity="error">{historyDialog.error}</Alert>
                    ) : historyDialog.data && (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Investment in {historyDialog.data.startupName}
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                by {historyDialog.data.investorName}
                            </Typography>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Current Amount: ${historyDialog.data.currentAmount}
                            </Typography>
                            <TableContainer 
                                component={Paper} 
                                sx={{ 
                                    mt: 2,
                                    '.MuiTableCell-root': {
                                        px: isMobile ? 1 : 2,
                                        py: isMobile ? 1 : 1.5
                                    }
                                }}
                            >
                                <Table size={isMobile ? "small" : "medium"}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historyDialog.data.history.map((record, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{record.formattedDate}</TableCell>
                                                <TableCell align="right">${record.amount}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </DialogContent>
                {!isMobile && (
                    <DialogActions>
                        <Button onClick={handleCloseHistory}>Close</Button>
                    </DialogActions>
                )}
            </Dialog>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            
            <Alert 
                severity={notification.severity}
                sx={{ 
                    position: 'fixed',
                    bottom: { xs: 0, sm: 24 },
                    right: { xs: 0, sm: 24 },
                    left: { xs: 0, sm: 'auto' },
                    display: notification.open ? 'flex' : 'none',
                    borderRadius: { xs: 0, sm: 1 }
                }}
                onClose={handleCloseNotification}
            >
                {notification.message}
            </Alert>
        </Box>
    );
};

export default InvestorInterface;
