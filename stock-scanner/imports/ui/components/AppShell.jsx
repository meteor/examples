import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import ShareIcon from '@mui/icons-material/Share';

const drawerWidth = 280;

export default function AppShell({
  children,
  currentView,
  mobileOpen,
  onMobileOpenChange,
  onNavigate,
  onShare,
  shareDisabled,
}) {
  function navigate(view) {
    onNavigate(view);
    onMobileOpenChange(false);
  }

  const drawer = (
    <Box className="navigation-content" role="navigation" aria-label="Primary navigation">
      <Box className="navigation-brand">
        <Box className="navigation-mark" aria-hidden="true">
          <Inventory2OutlinedIcon />
        </Box>
        <Box minWidth={0}>
          <Typography fontWeight={900}>Stock Scanner</Typography>
          <Typography color="text.secondary" fontSize={13}>Floor audit</Typography>
        </Box>
      </Box>
      <Divider />
      <List className="navigation-list">
        <ListItemButton
          component="button"
          selected={currentView === 'inventory'}
          aria-label="Inventory"
          onClick={() => navigate('inventory')}
        >
          <ListItemIcon><Inventory2OutlinedIcon /></ListItemIcon>
          <ListItemText primary="Inventory" secondary="Count and review stock" />
        </ListItemButton>
        <ListItemButton
          component="button"
          selected={currentView === 'system'}
          aria-label="System information"
          onClick={() => navigate('system')}
        >
          <ListItemIcon><InfoOutlinedIcon /></ListItemIcon>
          <ListItemText primary="System information" secondary="Runtime and updates" />
        </ListItemButton>
      </List>
      <Box className="navigation-version">
        <Typography color="text.secondary" fontSize={12}>Version 1.0.0 (1)</Typography>
      </Box>
    </Box>
  );

  return (
    <Box className="app-frame">
      <AppBar
        position="fixed"
        color="inherit"
        className="app-bar"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar className="app-toolbar">
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => onMobileOpenChange(true)}
            sx={{ display: { md: 'none' }, width: 48, height: 48, mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" fontWeight={900} noWrap flex={1}>
            Stock Scanner
          </Typography>
          {currentView === 'inventory' && (
            <Tooltip title="Share audit">
              <span>
                <IconButton
                  aria-label="Share audit"
                  onClick={onShare}
                  disabled={shareDisabled}
                  sx={{ width: 48, height: 48 }}
                >
                  <ShareIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" aria-label="Application sections">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => onMobileOpenChange(false)}
          ModalProps={{ keepMounted: true }}
          className="mobile-navigation"
          PaperProps={{ className: 'navigation-drawer' }}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          PaperProps={{ className: 'navigation-drawer' }}
          sx={{ display: { xs: 'none', md: 'block' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        className="app-main"
        sx={{ ml: { md: `${drawerWidth}px` } }}
      >
        <Toolbar className="app-toolbar-spacer" />
        {children}
      </Box>
    </Box>
  );
}
