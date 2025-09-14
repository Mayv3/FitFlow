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
  height = 600,
}: GenericDataGridProps<T>) {
  return (

    <Box
      sx={{
        overflowX: 'auto',
      }}
    >
      <Box
        sx={{
          minWidth: '1400px',
        }}
      >
        <DataGrid
          sx={{
            backgroundColor: 'white',
            maxHeight: { xs: '70vh' },

            '& .MuiDataGrid-main': { backgroundColor: 'white' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: 'white' },
            '& .MuiDataGrid-columnHeader': { backgroundColor: 'white' },
            '& .MuiDataGrid-columnHeadersInner': { backgroundColor: 'white' },
            '& .MuiDataGrid-virtualScroller': { backgroundColor: 'white' },
            '& .MuiDataGrid-footerContainer': { backgroundColor: 'white' },

            ...(rows || []).reduce((acc, r) => {
              return acc
            }, {} as any),
          }}
          checkboxSelection={false}
          hideFooterSelectedRowCount
          rows={rows}
          columns={columns}
          disableColumnResize
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
        />

      </Box>
    </Box>
  );
}
