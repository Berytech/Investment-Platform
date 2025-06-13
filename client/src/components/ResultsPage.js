import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Stack,
    Grow,
    Fade,
    Zoom,
    Collapse
} from '@mui/material';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useParams } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import useInterval from '../hooks/useInterval';

// Define shimmer animation
const shimmer = keyframes`
    0% { transform: translateX(-100%) }
    50% { transform: translateX(100%) }
    100% { transform: translateX(100%) }
`;

const ResultsPage = () => {
    const { eventId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [resultsRevealed, setResultsRevealed] = useState(false);
    const [animationStarted, setAnimationStarted] = useState(false);
    const prevTotalRef = useRef(null);
    const [hasIncrease, setHasIncrease] = useState(false);
    const [isPolling, setIsPolling] = useState(true); // Control polling state

    const fetchData = useCallback(async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
                // On initial load, fetch both event details and investment summary
                const [eventResponse, summaryResponse] = await Promise.all([
                    adminApi.getEventDetails(eventId),
                    adminApi.getEventInvestmentSummary(eventId)
                ]);
                setEventData(eventResponse);
                setSummaryData(summaryResponse);
                prevTotalRef.current = summaryResponse.eventTotal;
            } else {
                // During polling, only fetch summary and update if there's a change
                const summaryResponse = await adminApi.getEventInvestmentSummary(eventId);
                
                // Only update state if the totals are different
                if (prevTotalRef.current !== summaryResponse.eventTotal) {
                    console.log('Investment total changed:', { 
                        prevTotal: prevTotalRef.current, 
                        newTotal: summaryResponse.eventTotal 
                    });
                    setSummaryData(summaryResponse);
                    setHasIncrease(prevTotalRef.current !== null && summaryResponse.eventTotal > prevTotalRef.current);
                    prevTotalRef.current = summaryResponse.eventTotal;
                    
                    if (hasIncrease) {
                        setTimeout(() => setHasIncrease(false), 2000);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            if (isInitialLoad) {
                setError(error.response?.data?.message || 'Error loading results');
            }
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [eventId, hasIncrease]);

    // Initial load
    useEffect(() => {
        console.log('Initial load');
        fetchData(true);
    }, [fetchData]);

    // Set up polling using useInterval hook
    useInterval(() => {
        if (isPolling) {
            console.log('Checking for investment updates...');
            fetchData(false);
        }
    }, 10000); // Poll every 10 seconds instead of 5

    // Debug current state
    useEffect(() => {
        console.log('Current state:', {
            eventData,
            summaryData,
            loading,
            error,
            isPolling
        });
    }, [eventData, summaryData, loading, error, isPolling]);

    const toggleReveal = () => {
        if (!resultsRevealed) {
            setAnimationStarted(true);
            setTimeout(() => setResultsRevealed(true), 300);
        } else {
            setResultsRevealed(false);
            setAnimationStarted(false);
        }
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
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                        {eventData?.event?.name} Results
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setIsPolling(prev => !prev)}
                        color={isPolling ? "error" : "primary"}
                    >
                        {isPolling ? "Pause Updates" : "Resume Updates"}
                    </Button>
                </Box>

                <Stack spacing={3} sx={{ mt: 3 }}>
                    {/* Total Investment Overview - Always Visible */}
                    {summaryData && (
                        <Card 
                            sx={{ 
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': animationStarted ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `linear-gradient(90deg, transparent, ${theme.palette.background.paper}20, transparent)`,
                                    animation: `${shimmer} 2s infinite`,
                                } : {}
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Total Investment Overview
                                </Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                                        <Typography 
                                            variant="h3" 
                                            color="primary" 
                                            gutterBottom
                                            sx={{
                                                transition: 'transform 0.3s ease, color 0.3s ease',
                                                transform: hasIncrease ? 'scale(1.1)' : 'scale(1)',
                                                color: hasIncrease ? 'success.main' : 'primary.main',
                                            }}
                                        >
                                            ${summaryData.eventTotal.toLocaleString()}
                                        </Typography>
                                    </Zoom>
                                    <Collapse in={hasIncrease}>
                                        <Typography 
                                            color="success.main" 
                                            sx={{ 
                                                position: 'absolute',
                                                top: '100%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                animation: `${shimmer} 1s ease-out`,
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Investment Updated! ↑
                                        </Typography>
                                    </Collapse>
                                </Box>
                                <Typography 
                                    color="text.secondary"
                                    sx={{
                                        mt: hasIncrease ? 4 : 2,
                                        transition: 'margin 0.3s ease'
                                    }}
                                >
                                    Total investments from {summaryData.byInvestor.length} investors
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ 
                                        display: 'block',
                                        mt: 1,
                                        opacity: 0.7
                                    }}
                                >
                                    Updates automatically every 5 seconds
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reveal Results Button */}
                    <Button
                        variant="contained"
                        color={resultsRevealed ? "secondary" : "primary"}
                        onClick={toggleReveal}
                        startIcon={resultsRevealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        sx={{ 
                            alignSelf: 'center',
                            transform: animationStarted ? 'scale(1.1)' : 'scale(1)',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.05)'
                            }
                        }}
                    >
                        {resultsRevealed ? 'Hide Leaderboard' : 'Reveal Leaderboard'}
                    </Button>

                    {/* Startup Leaderboard */}
                    {summaryData && (
                        <Grow 
                            in={resultsRevealed} 
                            timeout={800}
                            style={{ transformOrigin: '0 0 0' }}
                        >
                            <Box>
                                <Fade in={resultsRevealed} timeout={1000}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                        🏆 Startup Leaderboard 🏆
                                    </Typography>
                                </Fade>
                                <TableContainer 
                                    component={Paper}
                                    sx={{
                                        transition: 'all 0.3s ease',
                                        transform: resultsRevealed ? 'translateY(0)' : 'translateY(20px)',
                                        opacity: resultsRevealed ? 1 : 0
                                    }}
                                >
                                    <Table size={isMobile ? "small" : "medium"}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Rank</TableCell>
                                                <TableCell>Startup</TableCell>
                                                <TableCell align="right">Total Investment</TableCell>
                                                <TableCell align="right"># of Investors</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {summaryData.byStartup
                                                .sort((a, b) => b.total - a.total)
                                                .map((startup, index) => (
                                                    <Fade 
                                                        key={startup._id} 
                                                        in={resultsRevealed}
                                                        timeout={500 + (index * 100)}
                                                    >
                                                        <TableRow
                                                            sx={{
                                                                bgcolor: index === 0 ? 'success.light' :
                                                                        index === 1 ? 'info.light' :
                                                                        index === 2 ? 'warning.light' : 'inherit',
                                                                transition: 'background-color 0.3s ease'
                                                            }}
                                                        >
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell>{startup.startup.name}</TableCell>
                                                            <TableCell align="right">${startup.total.toLocaleString()}</TableCell>
                                                            <TableCell align="right">{startup.investmentCount}</TableCell>
                                                        </TableRow>
                                                    </Fade>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Grow>
                    )}
                </Stack>
            </Paper>
        </Box>
    );
};

export default ResultsPage;
