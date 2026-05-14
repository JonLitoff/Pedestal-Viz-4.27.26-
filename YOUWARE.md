# PedestalViz – Concrete Pedestal, Rebar & Anchor Bolt Designer

PedestalViz is a professional structural engineering visualization tool for designing concrete pedestals, rebar cages, and anchor bolt assemblies. It provides real-time 2D and 3D visualizations with precise geometric calculations based on ACI 318-19 standards.

## Key Features

- **Interactive 3D Engine**: Fully rotatable, zoomable, and pannable 3D model using Three.js.
- **2D Engineering Views**: Precise Plan and Elevation views with dimension lines and legends.
- **Real-time Calculations**: Automatic calculation of rebar positions, tie spacing, and anchor bolt embedment depth.
- **ACI 318-19 Compliance**: Standard bar diameters and reinforcement detailing.
- **Export Capabilities**: Download PNG screenshots of any view and generate a comprehensive PDF design report.
- **Live Validation**: Instant warnings for clearance issues, bolt placement, and embedment depth.

## Project Status

- **Project Type**: React + TypeScript + Three.js Engineering Application
- **Entry Point**: `src/main.tsx`
- **Build System**: Vite 7.0.0
- **Styling**: Tailwind CSS 3.4.17
- **3D Engine**: Three.js
- **PDF Generation**: jsPDF

## Mobile Rules Summary

- **🚨 MANDATORY**: Use `src/utils/mobileFeatures.ts` for image downloads and device feedback.
- **Touch-Optimized**: 44px minimum touch targets and gesture-native interactions.
- **Safe Area Compliance**: Support for notched devices.
- **Performance**: Optimized for mobile device constraints.

## Technical Details

- **State Management**: React Hooks (useState, useMemo) for real-time responsiveness.
- **Visualization**: SVG for 2D views, WebGL (Three.js) for 3D views.
- **Calculations**: Geometric algorithms for rebar and tie placement based on user-defined clearances.
