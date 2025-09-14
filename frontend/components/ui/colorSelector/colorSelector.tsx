import { useState } from "react"
import { Box, Button, Popover, Grow } from "@mui/material"

const presetColors = [
    "#F44336",
    "#FF5722",
    "#FFC107",
    "#4CAF50",
    "#009688",
    "#00BCD4",
    "#2196F3",
    "#3F51B5",
    "#9C27B0",
  ]

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
                slotProps={{ paper: { sx: { width } } }}
                slots={{ transition: Grow }}
                transitionDuration={{ enter: 140, exit: 0 }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 2,
                        p: 2,
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
                                width: 32,
                                height: 32,
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
