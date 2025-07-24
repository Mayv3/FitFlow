import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';

type GenericDataGridProps<T extends { id: string | number }> = {
  title?: string;
  rows: T[];
  columns: GridColDef[];
  paginationMode?: 'client' | 'server';
  rowCount?: number;
  page?: number;
  pageSize?: number;
  loading?: boolean;
  pageSizeOptions?: number[];
  initialPagination?: GridPaginationModel;
  height?: number;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
};

export function GenericDataGrid<T extends { id: string | number }>({
  title,
  rows,
  columns,
  paginationMode = 'client',
  rowCount,
  page,
  pageSize,
  onPaginationModelChange,
  loading = false,
  pageSizeOptions = [5, 10],
  initialPagination = { page: 0, pageSize: 5 },
  height = 400,
}: GenericDataGridProps<T>) {
  return (
    <Box sx={{ width: '100%', height }}>
      {title && <h4>{title}</h4>}
      <Paper sx={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnMenu
          paginationMode={paginationMode}
          {...(paginationMode === 'server' && {
            rowCount,
            paginationModel: { page: page!, pageSize: pageSize! },
            onPaginationModelChange,
            loading,
          })}
          {...(paginationMode === 'client' && {
            initialState: {
              sorting: { sortModel: [{ field: 'nombre', sort: 'asc' }] },
              pagination: { paginationModel: initialPagination },
            },
          })}
          pageSizeOptions={pageSizeOptions}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              minWidth: '100%',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
