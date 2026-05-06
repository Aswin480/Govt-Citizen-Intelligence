import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

// Mock Data Type (Replace with real API type later)
interface Member {
    id: string;
    name: string;
    party: string;
    constituency: string;
    house: string;
    image?: string;
}

// Props
interface HemicycleProps {
    members: Member[];
    onHover: (member: Member | null, vector?: THREE.Vector3) => void;
    onSelect: (member: Member) => void;
}

export const HemicycleGrouping: React.FC<HemicycleProps> = ({ members, onHover, onSelect }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null);

    // Configuration
    const rows = 12;
    const startRadius = 15;
    const rowSpacing = 3;
    const arcAngle = Math.PI;

    // Generate Data
    const { seats, colors } = useMemo(() => {
        const generatedSeats = [];
        const generatedColors = new Float32Array(members.length * 3);
        const tempColor = new THREE.Color();
        let memberIndex = 0;

        for (let r = 0; r < rows; r++) {
            const radius = startRadius + (r * rowSpacing);
            const circumference = Math.PI * radius;
            const seatsInRow = Math.floor(circumference / 2.5);
            const angleStep = arcAngle / (seatsInRow + 1);

            for (let s = 1; s <= seatsInRow; s++) {
                if (memberIndex >= members.length) break;

                const angle = s * angleStep;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                const y = (r * 1.5) - 2;

                const position = new THREE.Vector3(x, y, -z);
                const rotation = new THREE.Euler(0, -angle + Math.PI / 2, 0);

                // transform Matrix
                const matrix = new THREE.Matrix4();
                matrix.makeRotationFromEuler(rotation);
                matrix.setPosition(position);

                generatedSeats.push({ matrix, member: members[memberIndex] });

                // Colors
                const p = members[memberIndex].party.toLowerCase();
                if (p.includes('bjp')) tempColor.set('#FF9933');
                else if (p.includes('inc') || p.includes('congress')) tempColor.set('#00BFFF');
                else tempColor.set('#888888');

                tempColor.toArray(generatedColors, memberIndex * 3);

                memberIndex++;
            }
        }
        return { seats: generatedSeats, colors: generatedColors };
    }, [members]);

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        // Update matrices
        seats.forEach((seat, i) => {
            meshRef.current!.setMatrixAt(i, seat.matrix);
        });

        // Update colors
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [seats, colors]);

    // Create a temp object for hover effect logic if needed
    // For simple highlighting, we might use bloom or modify color of that instance temporarily
    // But instancedMesh makes individual material changes hard. 
    // Trick: Emissive map or just re-upload color buffer on hover? Re-uploading buffer is cheap for 500 items.

    if (seats.length === 0) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, seats.length]}
            onPointerMove={(e) => {
                e.stopPropagation();
                const id = e.instanceId;
                if (id !== undefined && seats[id]) {
                    if (id !== hoveredInstanceId) {
                        setHoveredInstanceId(id);
                        document.body.style.cursor = 'pointer';
                        onHover(seats[id].member, new THREE.Vector3().setFromMatrixPosition(seats[id].matrix));
                    }
                }
            }}
            onPointerOut={() => {
                setHoveredInstanceId(null);
                document.body.style.cursor = 'auto';
                onHover(null);
            }}
            onClick={(e) => {
                e.stopPropagation();
                const id = e.instanceId;
                if (id !== undefined && seats[id]) {
                    onSelect(seats[id].member);
                }
            }}
        >
            {/* Simple representation of Desk + Seat */}
            <boxGeometry args={[0.8, 0.4, 0.5]} />
            <meshStandardMaterial
                color="#00a86b" // Lok Sabha Teal Green Seat
                metalness={0.1}
                roughness={0.8} // Fabric/Wood texture
                vertexColors={false} // Use uniform color for dignity, maybe use instanceColor for party coding if requested later
            />
        </instancedMesh>
    );
};
