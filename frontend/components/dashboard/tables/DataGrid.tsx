'use client';

import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';

type GenericDataGridProps<T extends { id: string | number }> = {
  title?: string;
  rows: T[];
  columns: GridColDef[];
  pageSizeOptions?: number[];
  initialPagination?: GridPaginationModel;
  height?: number;
};

export function GenericDataGrid<T extends { id: string | number }>({
  rows,
  columns,
  pageSizeOptions = [5, 10],
  initialPagination = { page: 0, pageSize: 5 },
}: GenericDataGridProps<T>) {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', overflowX: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnMenu
          initialState={{
            sorting: {
              sortModel: [{ field: 'nombre', sort: 'asc' }],
            },
            pagination: {
              paginationModel: initialPagination,
            },
          }}
          pageSizeOptions={pageSizeOptions}
          disableColumnResize
          sx={{
            border: 0,
            width: '100%',
            '& .MuiDataGrid-columnHeaders': {
              minWidth: '100%',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
