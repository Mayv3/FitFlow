'use client';

import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useActiveMembersPaymentDetails } from '@/hooks/dashboard/useActiveMembersPaymentDetails';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';

type Props = {
    open: boolean;
    onClose: () => void;
    gymId?: string;
};

export function RenovacionesModal({
    open,
    onClose,
    gymId,
}: Props) {
    const t = useTheme();
    const { primaryColor } = useGymThemeSettings();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data, isLoading } = useActiveMembersPaymentDetails(year, month);

    const items = data?.items ?? [];
    const total = items.length;

    const itemSx = {
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
        background: alpha(t.palette.background.paper, 0.6),
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Renovaciones del mes
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                        {total} renovaciones este mes
                    </Typography>
                </Box>
                <Box component="button" onClick={onClose}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>✕</Box>
            </Box>

            <DialogContent
                sx={{
                    pt: 1,
                    maxHeight: { xs: '50vh' },
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : total === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No hay renovaciones este mes.
                    </Typography>
                ) : (
                    <Box display="grid" gap={1.5}>
                        {items.map((a: any) => (
                            <Box key={a.id} sx={itemSx}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box overflow="hidden">
                                        <Typography fontWeight={500} noWrap>
                                            {a.alumno_nombre}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {a.plan_nombre}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        sx={{ color: '#22c55e', whiteSpace: 'nowrap', ml: 1 }}
                                    >
                                        {a.fecha_de_pago?.split('-').reverse().join('/')}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
