import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

type Clinic = { id: string; name: string };
type Procedure = { id: string; name: string; clinicId: string };
type Doctor = { id: string; name: string; clinicId: string; procedureIds: string[] };

export default function AppointmentForm(): React.ReactElement {
    const navigate = useNavigate();

    const clinics: Clinic[] = [
        { id: "c1", name: "Downtown Clinic" },
        { id: "c2", name:  "Lakeside Health" },
    ];

    const procedures: Procedure[] = [
        { id: "p1", name: "General Checkup", clinicId: "c1" },
        { id: "p2", name: "Dermatology Visit", clinicId:  "c1" },
        { id:  "p3", name: "Dental Cleaning", clinicId: "c2" },
        { id: "p4", name: "Physical Therapy", clinicId: "c2" },
    ];

    const doctors:  Doctor[] = [
        { id: "d1", name:  "Dr. Alice Smith", clinicId: "c1", procedureIds: ["p1", "p2"] },
        { id: "d2", name: "Dr. Bob Jones", clinicId:  "c1", procedureIds: ["p1"] },
        { id: "d3", name: "Dr.  Carol Lee", clinicId:  "c2", procedureIds: ["p3", "p4"] },
    ];

    const [clinicId, setClinicId] = useState<string>("");
    const [procedureId, setProcedureId] = useState<string>("");
    const [doctorId, setDoctorId] = useState<string>("");

    const availableProcedures = useMemo(
        () => procedures.filter((p) => p.clinicId === clinicId),
        [clinicId]
    );

    const availableDoctors = useMemo(
        () =>
            doctors.filter(
                (d) =>
                    d.clinicId === clinicId &&
                    (procedureId ?  d.procedureIds.includes(procedureId) : true)
            ),
        [clinicId, procedureId]
    );

    const handleProceed = () => {
        if (clinicId && procedureId && doctorId) {
            navigate("/calendar");
        }
    };

    const isFormValid = clinicId && procedureId && doctorId;

    return (
        <div className="medicare-bg-gray-50 medicare-flex medicare-items-center medicare-justify-center" 
             style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>
            <Navbar />
            
            <div className="medicare-card" style={{ maxWidth:  '500px', width: '100%' }}>
                <div className="medicare-card-header">
                    <h2 className="medicare-card-title medicare-text-center">
                        <br />
                        📅 Rezervace návštěvy
                    </h2>
                </div>

                <div className="medicare-card-body">
                    <form onSubmit={(e) => e.preventDefault()}>
             
                        <div className="medicare-form-group">
                            <label className="medicare-label">
                                🏥 Vyberte kliniku
                            </label>
                            <select 
                                value={clinicId} 
                                onChange={(e) => {
                                    setClinicId(e.target.value);
                                    setProcedureId("");
                                    setDoctorId("");
                                }} 
                                className="medicare-select"
                                required
                            >
                                <option value="">-- Vyberte kliniku --</option>
                                {clinics.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                      
                        <div className="medicare-form-group">
                            <label className="medicare-label">
                                🩺 Typ vyšetření
                            </label>
                            <select
                                value={procedureId}
                                onChange={(e) => {
                                    setProcedureId(e.target.value);
                                    setDoctorId("");
                                }}
                                className="medicare-select"
                                disabled={!clinicId}
                                required
                            >
                                <option value="">-- Vyberte vyšetření --</option>
                                {availableProcedures. map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            {!clinicId && (
                                <p className="medicare-text-gray-500" style={{ fontSize: '0.875rem', marginTop:  '0.5rem' }}>
                                    Nejprve vyberte kliniku
                                </p>
                            )}
                        </div>

                 
                        <div className="medicare-form-group">
                            <label className="medicare-label">
                                👨‍⚕️ Lékař
                            </label>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                className="medicare-select"
                                disabled={!procedureId}
                                required
                            >
                                <option value="">-- Vyberte lékaře --</option>
                                {availableDoctors.map((d) => (
                                    <option key={d. id} value={d.id}>
                                        {d. name}
                                    </option>
                                ))}
                            </select>
                            {! procedureId && clinicId && (
                                <p className="medicare-text-gray-500" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    Nejprve vyberte typ vyšetření
                                </p>
                            )}
                        </div>

             
                        <div className="medicare-bg-gray-100 medicare-rounded-lg medicare-p-4 medicare-mb-6">
                            <h4 className="medicare-text-gray-700 medicare-mb-2" style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                Postup rezervace: 
                            </h4>
                            <div className="medicare-flex" style={{ gap: '0.5rem' }}>
                                <div className={`medicare-rounded-full ${clinicId ? 'medicare-bg-success' : 'medicare-bg-gray-300'}`} 
                                     style={{ width: '12px', height: '12px' }}>
                                </div>
                                <div className={`medicare-rounded-full ${procedureId ? 'medicare-bg-success' : 'medicare-bg-gray-300'}`} 
                                     style={{ width: '12px', height: '12px' }}>
                                </div>
                                <div className={`medicare-rounded-full ${doctorId ? 'medicare-bg-success' : 'medicare-bg-gray-300'}`} 
                                     style={{ width: '12px', height: '12px' }}>
                                </div>
                            </div>
                            <p className="medicare-text-gray-600" style={{ fontSize: '0.75rem', marginTop:  '0.5rem' }}>
                                {! clinicId ? 'Vyberte kliniku' : 
                                 !procedureId ? 'Vyberte vyšetření' : 
                                 ! doctorId ? 'Vyberte lékaře' : 'Pokračujte k výběru termínu'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleProceed}
                            disabled={!isFormValid}
                            className={`medicare-btn medicare-w-full medicare-btn-lg ${
                                isFormValid ?  'medicare-btn-primary' : 'medicare-btn-secondary'
                            }`}
                            style={{ opacity: isFormValid ?  1 : 0.6 }}
                        >
                            {isFormValid ? '📅 Pokračovat k výběru termínu' : '⏳ Vyplňte všechna pole'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}