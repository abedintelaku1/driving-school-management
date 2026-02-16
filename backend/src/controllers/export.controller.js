const Candidate = require('../models/Candidate');
const Instructor = require('../models/Instructor');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper function to format date
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Eksport raportesh për kandidat specifik
 * Format: Excel, CSV, PDF
 */
const exportCandidateReport = async (req, res, next) => {
    try {
        const { candidateId, format } = req.query;
        
        if (!candidateId) {
            return res.status(400).json({ message: 'ID e kandidatit është e detyrueshme' });
        }
        
        if (!format || !['excel', 'csv', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Format i pavlefshëm. Përdorni: excel, csv, ose pdf' });
        }
        
        // Get candidate
        const candidate = await Candidate.findById(candidateId)
            .populate('instructorId', 'user')
            .lean();
        
        if (!candidate) {
            return res.status(404).json({ message: 'Kandidati nuk u gjet' });
        }
        
        // Get payments
        const payments = await Payment.find({ candidateId: candidate._id })
            .sort({ date: -1 })
            .lean();
        
        // Get appointments
        const appointments = await Appointment.find({ candidateId: candidate._id })
            .sort({ date: -1 })
            .lean();
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const completedHours = appointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + (a.hours || 0), 0);
        
        const candidateData = {
            ...candidate,
            totalPaid,
            completedHours,
            totalPayments: payments.length,
            totalAppointments: appointments.length,
            payments,
            appointments
        };
        
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            
            // Sheet 1: Informacioni i kandidatit
            const infoSheet = workbook.addWorksheet('Informacioni');
            infoSheet.columns = [
                { header: 'Fusha', key: 'field', width: 25 },
                { header: 'Vlera', key: 'value', width: 40 }
            ];
            
            infoSheet.getRow(1).font = { bold: true };
            infoSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            infoSheet.addRow({ field: 'Numri i klientit', value: candidate.uniqueClientNumber });
            infoSheet.addRow({ field: 'Emri', value: candidate.firstName });
            infoSheet.addRow({ field: 'Mbiemri', value: candidate.lastName });
            infoSheet.addRow({ field: 'Email', value: candidate.email });
            infoSheet.addRow({ field: 'Telefon', value: candidate.phone });
            infoSheet.addRow({ field: 'Data e lindjes', value: formatDate(candidate.dateOfBirth) });
            infoSheet.addRow({ field: 'Numri personal', value: candidate.personalNumber });
            infoSheet.addRow({ field: 'Adresa', value: candidate.address });
            infoSheet.addRow({ field: 'Statusi', value: candidate.status });
            infoSheet.addRow({ field: 'Total i paguar', value: `${totalPaid.toFixed(2)} EUR` });
            infoSheet.addRow({ field: 'Orë të përfunduara', value: `${completedHours}` });
            infoSheet.addRow({ field: 'Total pagesa', value: payments.length });
            infoSheet.addRow({ field: 'Total takime', value: appointments.length });
            
            // Sheet 2: Pagesat
            const paymentsSheet = workbook.addWorksheet('Pagesat');
            paymentsSheet.columns = [
                { header: 'Data', key: 'date', width: 15 },
                { header: 'Shuma', key: 'amount', width: 15 },
                { header: 'Metoda', key: 'method', width: 12 },
                { header: 'Shënime', key: 'notes', width: 30 }
            ];
            
            paymentsSheet.getRow(1).font = { bold: true };
            paymentsSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            payments.forEach(payment => {
                paymentsSheet.addRow({
                    date: formatDate(payment.date),
                    amount: payment.amount.toFixed(2),
                    method: payment.method,
                    notes: payment.notes || ''
                });
            });
            
            // Sheet 3: Takimet
            const appointmentsSheet = workbook.addWorksheet('Takimet');
            appointmentsSheet.columns = [
                { header: 'Data', key: 'date', width: 15 },
                { header: 'Orë', key: 'hours', width: 10 },
                { header: 'Statusi', key: 'status', width: 15 },
                { header: 'Shënime', key: 'notes', width: 30 }
            ];
            
            appointmentsSheet.getRow(1).font = { bold: true };
            appointmentsSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            appointments.forEach(appointment => {
                appointmentsSheet.addRow({
                    date: formatDate(appointment.date),
                    hours: appointment.hours || 0,
                    status: appointment.status,
                    notes: appointment.notes || ''
                });
            });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="raport-kandidat-${candidate.uniqueClientNumber}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
            
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="raport-kandidat-${candidate.uniqueClientNumber}.csv"`);
            
            res.write('\uFEFF'); // BOM for Excel
            res.write('Fusha,Vlera\n');
            res.write(`Numri i klientit,"${candidate.uniqueClientNumber}"\n`);
            res.write(`Emri,"${candidate.firstName}"\n`);
            res.write(`Mbiemri,"${candidate.lastName}"\n`);
            res.write(`Email,"${candidate.email}"\n`);
            res.write(`Telefon,"${candidate.phone}"\n`);
            res.write(`Data e lindjes,"${formatDate(candidate.dateOfBirth)}"\n`);
            res.write(`Numri personal,"${candidate.personalNumber}"\n`);
            res.write(`Adresa,"${candidate.address}"\n`);
            res.write(`Statusi,"${candidate.status}"\n`);
            res.write(`Total i paguar,"${totalPaid.toFixed(2)} EUR"\n`);
            res.write(`Orë të përfunduara,"${completedHours}"\n`);
            res.write(`Total pagesa,"${payments.length}"\n`);
            res.write(`Total takime,"${appointments.length}"\n`);
            res.write('\n');
            res.write('Pagesat\n');
            res.write('Data,Shuma,Metoda,Shënime\n');
            payments.forEach(p => {
                res.write(`"${formatDate(p.date)}","${p.amount.toFixed(2)}","${p.method}","${(p.notes || '').replace(/"/g, '""')}"\n`);
            });
            res.write('\n');
            res.write('Takimet\n');
            res.write('Data,Orë,Statusi,Shënime\n');
            appointments.forEach(a => {
                res.write(`"${formatDate(a.date)}","${a.hours || 0}","${a.status}","${(a.notes || '').replace(/"/g, '""')}"\n`);
            });
            
            res.end();
            
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="raport-kandidat-${candidate.uniqueClientNumber}.pdf"`);
            
            doc.pipe(res);
            
            // Header
            doc.fontSize(20).text('Raport për Kandidat', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Data e eksportit: ${new Date().toLocaleString('sq-AL')}`, { align: 'center' });
            doc.moveDown(2);
            
            // Informacioni i kandidatit
            doc.fontSize(16).text('Informacioni i Kandidatit', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            doc.text(`Numri i klientit: ${candidate.uniqueClientNumber}`);
            doc.text(`Emri: ${candidate.firstName} ${candidate.lastName}`);
            doc.text(`Email: ${candidate.email}`);
            doc.text(`Telefon: ${candidate.phone}`);
            doc.text(`Data e lindjes: ${formatDate(candidate.dateOfBirth)}`);
            doc.text(`Numri personal: ${candidate.personalNumber}`);
            doc.text(`Adresa: ${candidate.address}`);
            doc.text(`Statusi: ${candidate.status}`);
            doc.moveDown();
            doc.text(`Total i paguar: ${totalPaid.toFixed(2)} EUR`);
            doc.text(`Orë të përfunduara: ${completedHours}`);
            doc.text(`Total pagesa: ${payments.length}`);
            doc.text(`Total takime: ${appointments.length}`);
            doc.moveDown(2);
            
            // Pagesat
            if (payments.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Pagesat', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(11);
                payments.forEach((payment, index) => {
                    if (index > 0) doc.moveDown(0.3);
                    doc.text(`Data: ${formatDate(payment.date)}`);
                    doc.text(`Shuma: ${payment.amount.toFixed(2)} EUR`);
                    doc.text(`Metoda: ${payment.method}`);
                    if (payment.notes) doc.text(`Shënime: ${payment.notes}`);
                    doc.moveDown(0.5);
                });
            }
            
            // Takimet
            if (appointments.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Takimet', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(11);
                appointments.forEach((appointment, index) => {
                    if (index > 0) doc.moveDown(0.3);
                    doc.text(`Data: ${formatDate(appointment.date)}`);
                    doc.text(`Orë: ${appointment.hours || 0}`);
                    doc.text(`Statusi: ${appointment.status}`);
                    if (appointment.notes) doc.text(`Shënime: ${appointment.notes}`);
                    doc.moveDown(0.5);
                });
            }
            
            doc.end();
        }
    } catch (err) {
        console.error('Error exporting candidate report:', err);
        next(err);
    }
};

/**
 * Eksport raportesh për instruktor specifik
 * Format: Excel, CSV, PDF
 */
const exportInstructorReport = async (req, res, next) => {
    try {
        const { instructorId, format } = req.query;
        
        if (!instructorId) {
            return res.status(400).json({ message: 'ID e instruktorit është e detyrueshme' });
        }
        
        if (!format || !['excel', 'csv', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Format i pavlefshëm. Përdorni: excel, csv, ose pdf' });
        }
        
        // Get instructor
        const instructor = await Instructor.findById(instructorId)
            .populate('user', 'firstName lastName email')
            .lean();
        
        if (!instructor) {
            return res.status(404).json({ message: 'Instruktori nuk u gjet' });
        }
        
        // Get candidates
        const candidates = await Candidate.find({ instructorId: instructor._id })
            .lean();
        
        // Get appointments
        const appointments = await Appointment.find({ instructorId: instructor._id })
            .sort({ date: -1 })
            .lean();
        
        // Get payments for instructor's candidates
        const candidateIds = candidates.map(c => c._id);
        const payments = await Payment.find({ candidateId: { $in: candidateIds } })
            .lean();
        
        const completedAppointments = appointments.filter(a => a.status === 'completed');
        const totalHours = completedAppointments.reduce((sum, a) => sum + (a.hours || 0), 0);
        
        // Calculate total earnings based on instructor type
        let totalEarnings = 0;
        if (instructor.instructorType === 'outsider') {
            // For outsider, use totalCredits (calculated from ratePerHour × hours)
            totalEarnings = instructor.totalCredits || 0;
        } else {
            // For insider, use sum of payments from candidates (if needed, otherwise 0)
            totalEarnings = 0; // Insider instructors don't have hourly earnings
        }
        
        const instructorData = {
            ...instructor,
            firstName: instructor.user?.firstName || '',
            lastName: instructor.user?.lastName || '',
            email: instructor.user?.email || '',
            totalCandidates: candidates.length,
            totalHours,
            totalEarnings,
            totalAppointments: appointments.length,
            completedAppointments: completedAppointments.length,
            candidates,
            appointments,
            payments
        };
        
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            
            // Sheet 1: Informacioni i instruktorit
            const infoSheet = workbook.addWorksheet('Informacioni');
            infoSheet.columns = [
                { header: 'Fusha', key: 'field', width: 25 },
                { header: 'Vlera', key: 'value', width: 40 }
            ];
            
            infoSheet.getRow(1).font = { bold: true };
            infoSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            infoSheet.addRow({ field: 'Emri', value: instructorData.firstName });
            infoSheet.addRow({ field: 'Mbiemri', value: instructorData.lastName });
            infoSheet.addRow({ field: 'Email', value: instructorData.email });
            infoSheet.addRow({ field: 'Telefon', value: instructor.phone });
            infoSheet.addRow({ field: 'Numri personal', value: instructor.personalNumber });
            infoSheet.addRow({ field: 'Total kandidatë', value: instructorData.totalCandidates });
            infoSheet.addRow({ field: 'Orë totale', value: instructorData.totalHours });
            infoSheet.addRow({ field: 'Total fitime', value: `${instructorData.totalEarnings.toFixed(2)} EUR` });
            infoSheet.addRow({ field: 'Total takime', value: instructorData.totalAppointments });
            infoSheet.addRow({ field: 'Takime të përfunduara', value: instructorData.completedAppointments });
            
            // Sheet 2: Kandidatët
            const candidatesSheet = workbook.addWorksheet('Kandidatët');
            candidatesSheet.columns = [
                { header: 'Numri i klientit', key: 'uniqueClientNumber', width: 15 },
                { header: 'Emri', key: 'firstName', width: 15 },
                { header: 'Mbiemri', key: 'lastName', width: 15 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Statusi', key: 'status', width: 12 }
            ];
            
            candidatesSheet.getRow(1).font = { bold: true };
            candidatesSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            candidates.forEach(candidate => {
                candidatesSheet.addRow({
                    uniqueClientNumber: candidate.uniqueClientNumber,
                    firstName: candidate.firstName,
                    lastName: candidate.lastName,
                    email: candidate.email,
                    status: candidate.status
                });
            });
            
            // Sheet 3: Takimet
            const appointmentsSheet = workbook.addWorksheet('Takimet');
            appointmentsSheet.columns = [
                { header: 'Data', key: 'date', width: 15 },
                { header: 'Kandidati', key: 'candidateName', width: 25 },
                { header: 'Orë', key: 'hours', width: 10 },
                { header: 'Statusi', key: 'status', width: 15 }
            ];
            
            appointmentsSheet.getRow(1).font = { bold: true };
            appointmentsSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            for (const appointment of appointments) {
                const candidate = candidates.find(c => c._id.toString() === appointment.candidateId.toString());
                appointmentsSheet.addRow({
                    date: formatDate(appointment.date),
                    candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A',
                    hours: appointment.hours || 0,
                    status: appointment.status
                });
            }
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="raport-instruktor-${instructorData.firstName}-${instructorData.lastName}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
            
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="raport-instruktor-${instructorData.firstName}-${instructorData.lastName}.csv"`);
            
            res.write('\uFEFF'); // BOM for Excel
            res.write('Fusha,Vlera\n');
            res.write(`Emri,"${instructorData.firstName}"\n`);
            res.write(`Mbiemri,"${instructorData.lastName}"\n`);
            res.write(`Email,"${instructorData.email}"\n`);
            res.write(`Telefon,"${instructor.phone}"\n`);
            res.write(`Numri personal,"${instructor.personalNumber}"\n`);
            res.write(`Total kandidatë,"${instructorData.totalCandidates}"\n`);
            res.write(`Orë totale,"${instructorData.totalHours}"\n`);
            res.write(`Total fitime,"${instructorData.totalEarnings.toFixed(2)} EUR"\n`);
            res.write(`Total takime,"${instructorData.totalAppointments}"\n`);
            res.write(`Takime të përfunduara,"${instructorData.completedAppointments}"\n`);
            res.write('\n');
            res.write('Kandidatët\n');
            res.write('Numri i klientit,Emri,Mbiemri,Email,Statusi\n');
            candidates.forEach(c => {
                res.write(`"${c.uniqueClientNumber}","${c.firstName}","${c.lastName}","${c.email}","${c.status}"\n`);
            });
            res.write('\n');
            res.write('Takimet\n');
            res.write('Data,Kandidati,Orë,Statusi\n');
            appointments.forEach(a => {
                const candidate = candidates.find(c => c._id.toString() === a.candidateId.toString());
                const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A';
                res.write(`"${formatDate(a.date)}","${candidateName}","${a.hours || 0}","${a.status}"\n`);
            });
            
            res.end();
            
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="raport-instruktor-${instructorData.firstName}-${instructorData.lastName}.pdf"`);
            
            doc.pipe(res);
            
            // Header
            doc.fontSize(20).text('Raport për Instruktor', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Data e eksportit: ${new Date().toLocaleString('sq-AL')}`, { align: 'center' });
            doc.moveDown(2);
            
            // Informacioni i instruktorit
            doc.fontSize(16).text('Informacioni i Instruktorit', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            doc.text(`Emri: ${instructorData.firstName} ${instructorData.lastName}`);
            doc.text(`Email: ${instructorData.email}`);
            doc.text(`Telefon: ${instructor.phone}`);
            doc.text(`Numri personal: ${instructor.personalNumber}`);
            doc.moveDown();
            doc.text(`Total kandidatë: ${instructorData.totalCandidates}`);
            doc.text(`Orë totale: ${instructorData.totalHours}`);
            doc.text(`Total fitime: ${instructorData.totalEarnings.toFixed(2)} EUR`);
            doc.text(`Total takime: ${instructorData.totalAppointments}`);
            doc.text(`Takime të përfunduara: ${instructorData.completedAppointments}`);
            doc.moveDown(2);
            
            // Kandidatët
            if (candidates.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Kandidatët', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(11);
                candidates.forEach((candidate, index) => {
                    if (index > 0) doc.moveDown(0.3);
                    doc.text(`${candidate.uniqueClientNumber} - ${candidate.firstName} ${candidate.lastName}`);
                    doc.text(`Email: ${candidate.email}, Statusi: ${candidate.status}`);
                    doc.moveDown(0.3);
                });
            }
            
            // Takimet
            if (appointments.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Takimet', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(11);
                appointments.forEach((appointment, index) => {
                    if (index > 0) doc.moveDown(0.3);
                    const candidate = candidates.find(c => c._id.toString() === appointment.candidateId.toString());
                    const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A';
                    doc.text(`Data: ${formatDate(appointment.date)}`);
                    doc.text(`Kandidati: ${candidateName}`);
                    doc.text(`Orë: ${appointment.hours || 0}, Statusi: ${appointment.status}`);
                    doc.moveDown(0.3);
                });
            }
            
            doc.end();
        }
    } catch (err) {
        console.error('Error exporting instructor report:', err);
        next(err);
    }
};

module.exports = {
    exportCandidateReport,
    exportInstructorReport
};

