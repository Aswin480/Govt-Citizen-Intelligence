import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CheckCircle, Fingerprint } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [generating, setGenerating] = useState(false);

    const handleFinish = () => {
        setGenerating(true);
        setTimeout(() => {
            navigate('/');
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
            <div className="max-w-xl w-full">

                {/* Progress Bar */}
                <div className="flex justify-between items-center mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10"></div>
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${step >= s ? 'bg-blue-600 border-slate-950 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                            } transition-all duration-500`}>
                            {step > s ? <CheckCircle size={16} /> : s}
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">

                    {generating ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-6 relative">
                                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                                <Fingerprint className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={40} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Generating Identity</h2>
                            <p className="text-slate-400">Encrypting biographical data...</p>
                            <p className="text-slate-500 text-xs mt-4 font-mono">HASH: 0x8F...A92</p>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-6">Personal Demographics</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-slate-400">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 outline-none" placeholder="John Doe" />
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold mt-4">Continue</button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-6">Regional Affiliation</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['North Zone', 'South Zone', 'East Zone', 'West Zone'].map((z) => (
                                            <button key={z} onClick={() => setStep(3)} className="p-4 border border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group">
                                                <MapPin className="mb-2 text-slate-500 group-hover:text-blue-400" />
                                                <span className="font-medium text-slate-300 group-hover:text-white">{z}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-6">Occupation & Sector</h2>
                                    <div className="space-y-4">
                                        <select className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 focus:border-blue-500 outline-none">
                                            <option>Select Occupation...</option>
                                            <option>Student</option>
                                            <option>Technology</option>
                                            <option>Healthcare</option>
                                            <option>Agriculture</option>
                                        </select>
                                        <button onClick={handleFinish} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold mt-4">
                                            Finalize Identity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
