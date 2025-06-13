import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Container,
    Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EventManagement from './EventManagement';
import InvestorManagement from './InvestorManagement';
import StartupManagement from './StartupManagement';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container>
                <Box sx={{ py: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Admin Dashboard
                    </Typography>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange}
                            aria-label="admin dashboard tabs"
                        >
                            <Tab label="Event Management" />
                            <Tab label="Investor Management" />
                            <Tab label="Startup Management" />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <EventManagement />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <InvestorManagement />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        <StartupManagement />
                    </TabPanel>
                </Box>
            </Container>
        </LocalizationProvider>
    );
};

export default AdminDashboard;
