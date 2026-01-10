import { useState } from "react"
import { Box, Button, Popover, Grow } from "@mui/material"

const presetColors = [
    // === Rojos & Rosas ===
    "#F44336", "#E53935", "#D32F2F", "#C62828",
    "#E91E63", "#EC407A", "#F06292", "#AD1457",

    // === Naranjas & Amarillos ===
    "#FF5722", "#FF7043", "#F4511E",
    "#FFC107", "#FFCA28", "#FFD54F", "#FBC02D",
    "#FFB300", "#FFA000",

    // === Verdes ===
    "#4CAF50", "#43A047", "#66BB6A", "#81C784",
    "#2E7D32", "#388E3C", "#00C853", "#1B5E20",

    // === Turquesas & Cian ===
    "#009688", "#26A69A", "#4DB6AC", "#00796B",
    "#00BCD4", "#26C6DA", "#4DD0E1", "#00838F",

    // === Azules ===
    "#2196F3", "#1E88E5", "#42A5F5", "#64B5F6",
    "#1565C0", "#0D47A1",

    // === Índigos & Violetas ===
    "#3F51B5", "#5C6BC0", "#7986CB",
    "#283593", "#1A237E",
    "#673AB7", "#7E57C2", "#9575CD",

    // === Morados & Fucsias ===
    "#9C27B0", "#AB47BC", "#BA68C8",
    "#8E24AA", "#6A1B9A", "#D81B60",

    // === Marrones & Neutros ===
    "#795548", "#8D6E63", "#A1887F",
    "#5D4037", "#3E2723",
    "#607D8B", "#78909C", "#90A4AE",

    // === Oscuros para planes premium ===
    "#263238", "#37474F", "#212121",
    "#1C1C1C", "#000000"
];


const getContrastColor = (hex: string) => {
    if (!hex) return "#000"
    const c = hex.slice(1)
    const rgb = parseInt(c, 16)
    const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = rgb & 0xff
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luma < 140 ? "#fff" : "#000"
}

export const ColorPickerPopover = ({
    value,
    onChange,
    label = "Color",
}: {
    value: string
    onChange: (c: string) => void
    label?: string
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)
    const width = anchorEl?.clientWidth || 200
    const textColor = value ? getContrastColor(value) : "#808080"

    return (
        <Box>
            <Button
                variant="outlined"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                fullWidth
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1,
                    textTransform: "none",

                    height: "56px",
                    borderRadius: "8px",
                    px: 2,
                    backgroundColor: value || "#fff",
                    color: textColor,
                    "&:hover": {
                        backgroundColor: value || "#fff",
                        borderColor: "primary.main",
                    },
                }}
            >
                {label}
            </Button>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{
                    paper: {
                        sx: {
                            width,
                            maxHeight: 340,   // 🔥 altura máxima del popover
                            overflow: "hidden", // evita que se rompa el layout
                        },
                    },
                }}
                slots={{ transition: Grow }}
                transitionDuration={{ enter: 140, exit: 0 }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 1,
                        p: 1,
                        maxHeight: 340,       // mismo alto que el paper
                        overflowY: "auto",   // 🔥 scroll vertical
                    }}
                >
                    {presetColors.map((c) => (
                        <Box
                            key={c}
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(c)
                                setAnchorEl(null)
                            }}
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: "50%",
                                backgroundColor: c,
                                border: value === c ? "2px solid black" : "1px solid transparent",
                                cursor: "pointer",
                                justifySelf: "center",
                                "&:hover": { opacity: 0.85 },
                            }}
                        />
                    ))}
                </Box>
            </Popover>
        </Box>
    )
}
