'use client';

import {displaySortKey, useMapboxDraw, useMapContext, useMapSelection, withDisplaySortKeys} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import type {FeatureCollection} from 'geojson';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import {useEffect, useState} from 'react';
import {AsyncDialogProps} from 'react-dialog-async';
import MapDialog from '../MapDialog';

export function AreaSettingsDialog({isOpen, handleClose}: AsyncDialogProps) {
  const draw = useMapboxDraw();
  const {features, setFeatures} = useMapContext();
  const selectedIds = useMapSelection();
  const [name, setName] = useState('');
  const [type, setType] = useState<AreaProps['type']>('draft');
  const [active, setActive] = useState(true);
  const [outlineCount, setOutlineCount] = useState<number | null>(null);

  // Initialize form values when dialog opens or selected area changes
  useEffect(() => {
    if (selectedIds.length === 0 || !draw) return;
    const selectedArea = draw!.get(selectedIds[0]);
    const properties = selectedArea!.properties! as AreaProps;
    setName(properties.name ?? '');
    setType(properties.type ?? 'draft');
    setActive(properties.active ?? true);
    setOutlineCount(typeof properties.outline_count === 'number' ? properties.outline_count : null);
  }, [draw, selectedIds]);

  const handleSave = () => {
    if (!draw || selectedIds.length === 0) return;

    const feature = draw.get(selectedIds[0])!;
    const index = features.features.findIndex((f) => f.id === feature.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {outline_count: _removed, ...restProperties} = (feature.properties ?? {}) as Record<string, unknown>;
    feature.properties = {
      ...restProperties,
      name,
      type,
      active,
      sort_key: displaySortKey(index, type, features.features),
      ...(outlineCount !== null ? {outline_count: outlineCount} : {}),
    };

    setFeatures((draft) => {
      const idx = draft.features.findIndex((f) => f.id === feature.id);
      if (idx !== -1) {
        draft.features[idx] = feature;
      }
      draw.set(withDisplaySortKeys(draft as FeatureCollection));
    });

    handleClose();
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <MapDialog open={isOpen} onClose={() => handleClose()} fullWidth maxWidth="xs">
      <DialogTitle>Area Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as AreaProps['type'])}
            label="Type"
            MenuProps={{
              disablePortal: true,
            }}
          >
            <MenuItem value="mow">Mowing Area</MenuItem>
            <MenuItem value="nav">Navigation Area</MenuItem>
            <MenuItem value="obstacle">Obstacle</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
          label="Active"
          sx={{mt: 2}}
        />

        <TextField
          label="Outline count"
          type="number"
          value={outlineCount ?? ''}
          onChange={(e) => setOutlineCount(e.target.value === '' ? null : Number(e.target.value))}
          fullWidth
          margin="normal"
          variant="outlined"
          slotProps={{htmlInput: {min: 0}}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose()}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={name === ''}>
          Save
        </Button>
      </DialogActions>
    </MapDialog>
  );
}
