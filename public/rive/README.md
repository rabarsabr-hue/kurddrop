# Rive map avatars

Place these files here for true Rive rendering:

- `map-avatar-male.riv`
- `map-avatar-female.riv`

Required in each file:

- State machine name: `AvatarSM`
- Input name: `pose` (string or enum matching timeline poses)

Until files exist, Kurd Drop uses the SVG skeletal fallback with the same pose names
(`stand_breathe`, `kneel`, `ring_pocket`, `offer_ring`, `shock`, `kiss_l`, …).
