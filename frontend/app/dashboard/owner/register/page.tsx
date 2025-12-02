"use client"

import { useState } from "react"
import { CreateGym } from "@/components/owner/CreateGym"
import { ManageGymUsers } from "@/components/owner/ManageGymUsers"
import { ManageGymPlans } from "@/components/owner/ManageGymPlans"
import { AssignPlanToGym } from "@/components/owner/AssignPlanToGym"
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from "@mui/material"
import BusinessIcon from "@mui/icons-material/Business"
import PeopleIcon from "@mui/icons-material/People"
import CardMembershipIcon from "@mui/icons-material/CardMembership"
import AssignmentIcon from "@mui/icons-material/Assignment"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ pt: 3 }}
    >
      {value === index && children}
    </Box>
  )
}

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          p: 3, 
          backgroundColor: "#0dc985",
          borderRadius: 1.5,
        }}
      >
        <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
          Panel de Administración
        </Typography>
        <Typography variant="body1" color="grey.400">
          Gestiona gimnasios, usuarios, planes y suscripciones desde un solo lugar.
        </Typography>
      </Paper>

      <Paper sx={{ borderRadius: 1.5, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            "& .MuiTab-root": {
              minHeight: 64,
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          }}
        >
          <Tab 
            icon={<BusinessIcon />} 
            iconPosition="start" 
            label="Gimnasios" 
          />
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            label="Usuarios" 
          />
          <Tab 
            icon={<CardMembershipIcon />} 
            iconPosition="start" 
            label="Planes" 
          />
          <Tab 
            icon={<AssignmentIcon />} 
            iconPosition="start" 
            label="Suscripciones" 
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <TabPanel value={activeTab} index={0}>
            <CreateGym />
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <ManageGymUsers />
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <ManageGymPlans />
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <AssignPlanToGym />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}
