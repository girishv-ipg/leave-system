import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import React from 'react'

// const useStyles = makeStyles(() => ({
//     root: {
//         '& td ': {
//             color: '#141C4C',
//             fontFamily: "Poppins",
//         },
//     },

//     tr: {
//         '& td:first-child ': {
//             borderTopLeftRadius: '8px',
//             borderBottomLeftRadius: '8px',
//         },
//         '& td:last-child ': {
//             borderTopRightRadius: '8px',
//             borderBottomRightRadius: '8px',
//         },
//     },
// }));


const CommonTable = ({ data, cols }) => {
    // const classes = useStyles();
    const width = typeof window !== 'undefined' ? window.innerWidth : null

    return (
        <TableContainer
            elevation={0}
            component={Paper}
            sx={{ borderRadius: '0.5rem', backgroundColor: 'white', alignItems: 'center' }}
        >
            <Table
                sx={{
                    [`& .${tableCellClasses.root}`]: {
                        borderBottom: 'none',
                    },
                    minWidth: 650,
                    border: '1px solid #E7E8ED',
                    borderCollapse: 'separate',
                    borderSpacing: width < 768 ? '0px 3px' : '0px 20px',
                    px: '24px',
                    borderRadius: '8px',
                    '& .MuiTableCell-head': {
                        padding: 0,
                    },
                }}
                className={{
                    root: {
                        '& td ': {
                            color: '#141C4C',
                            fontFamily: "Poppins",
                        },
                    }
                }}
                aria-label='simple table'
            >
                <TableHead>
                    <TableRow>
                        {React.Children.toArray(cols.map((headerItem, index) => (
                            <TableCell align='center' sx={{ color: '#5B6082', fontSize: '0.8rem', fontFamily: "Poppins" }} key={index}>
                                {headerItem.title}
                            </TableCell>
                        )))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {React.Children.toArray(data.map((item) => (
                        <TableRow
                            // key={uuid()}
                            sx={{ height: '16px', backgroundColor: '#F1F4F8', color: '#141C4C' }}
                            className={{
                                tr: {
                                    '& td:first-child ': {
                                        borderTopLeftRadius: '8px',
                                        borderBottomLeftRadius: '8px',
                                    },
                                    '& td:last-child ': {
                                        borderTopRightRadius: '8px',
                                        borderBottomRightRadius: '8px',
                                    },
                                },
                            }}
                        >
                            {React.Children.toArray(cols.map((col) => (
                                <TableCell
                                    align="center"
                                    // key={uuid()}
                                    sx={{ fontSize: '0.8rem', color: '#141C4C' }}>
                                    <div className="font-poppins font-medium">
                                        {col.render(item)}
                                    </div>
                                </TableCell>
                            )))}
                        </TableRow>
                    )))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CommonTable;