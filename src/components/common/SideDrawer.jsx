import React from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer';

const SidebarDrawer = ({ anchor, open, handleClose, renderComponent }) => {
  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={handleClose}
    >
      <Box sx={{ width: 450 }} role="presentation">

        {renderComponent}

      </Box>
    </Drawer>
  )
}

export default SidebarDrawer