import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
    "https://qwgujmdhlsybxfvbrdpp.supabase.co",
    "sb_publishable_d-VDeYzoceFfGdnyz8wQsQ_7Qlyv13g"
);

let role = "student";
let currentUser = "";

// 🔐 LOGIN SYSTEM
window.login = function() {
    let user = document.getElementById("username").value.trim();
    let pass = document.getElementById("password").value.trim();

    if (user === "admin" && pass === "admin3221") {
        role = "admin";
        currentUser = "Admin";
        document.body.classList.add('admin-mode');
    } else if (pass === "Hare Krishna") {
        role = "student";
        currentUser = user;
        document.body.classList.remove('admin-mode');
    } else {
        alert("Login Failed! Please check your credentials.");
        return;
    }

    // UI Updates
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("roleBadge").innerText = role.toUpperCase();
    document.getElementById("greetingText").innerText = `Hare Krishna, ${currentUser}`;

    // Field Control
    const nameField = document.getElementById("name");
    nameField.value = (role === "admin") ? "" : currentUser;
    nameField.readOnly = (role !== "admin");
    if(role === "admin") nameField.placeholder = "Enter Student Name";

    loadData();
};

// 📤 ADD DATA
window.addData = async function() {
    const saveBtn = document.getElementById("saveBtn");
    let file = document.getElementById("photo").files[0];
    let photoURL = "";

    saveBtn.innerText = "Syncing...";
    saveBtn.disabled = true;

    try {
        if (file) {
            let fileName = `${Date.now()}_${file.name}`;
            let { error: storageError } = await supabase.storage
                .from("photos")
                .upload(fileName, file);

            if (storageError) throw new Error("Storage Upload Error: " + storageError.message);

            photoURL = supabase.storage
                .from("photos")
                .getPublicUrl(fileName).data.publicUrl;
        }

        const { error: dbError } = await supabase.from("students_data").insert([{
            name: document.getElementById("name").value,
            date: document.getElementById("date").value,
            wake: document.getElementById("wake").value,
            rounds: document.getElementById("rounds").value,
            study: document.getElementById("study").value,
            photo: photoURL
        }]);

        if (dbError) throw dbError;

        alert("Record Saved Successfully! ✅");
        loadData();

    } catch (err) {
        alert("System Error: " + err.message);
    } finally {
        saveBtn.innerText = "Save Progress ➜";
        saveBtn.disabled = false;
    }
};

// 🗑️ DELETE RECORD (ADMIN ONLY) - FIXED
window.deleteEntry = async function(id) {
    if (role !== 'admin') return;
    
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
        const { error } = await supabase
            .from("students_data")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Database Error: " + error.message);
        } else {
            alert("Record deleted! ✅");
            // Delay refresh to ensure DB update is reflected
            setTimeout(() => { loadData(); }, 300);
        }
    } catch (err) {
        alert("System error: " + err.message);
    }
};

// 📥 LOAD DATA - WITH DYNAMIC REFRESH
async function loadData() {
    try {
        let { data, error } = await supabase
            .from("students_data")
            .select("*")
            .order("date", { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById("tableBody");
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${role === 'admin' ? 7 : 6}" style="text-align:center; padding: 20px; color: var(--text-dim);">No records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(d => `
            <tr>
                <td style="font-weight:600; color:${role === 'admin' ? 'var(--admin-gold)' : 'var(--accent)'}">${d.name}</td>
                <td style="color: var(--text-dim)">${d.date}</td>
                <td>${d.wake || '--'}</td>
                <td><span style="background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 4px;">${d.rounds || 0}</span></td>
                <td>${d.study || 0}h</td>
                <td>
                    ${d.photo ? `<img src="${d.photo}" class="img-preview" onclick="window.open('${d.photo}', '_blank')">` : '—'}
                </td>
                ${role === 'admin' ? `<td><button class="btn-delete" onclick="deleteEntry('${d.id}')">Delete</button></td>` : ''}
            </tr>
        `).join('');
    } catch (err) {
        console.error("Load Error:", err);
    }
}

// 📥 EXPORT TO CSV
window.exportToCSV = async function() {
    try {
        let { data, error } = await supabase
            .from("students_data")
            .select("*")
            .order("date", { ascending: false });
            
        if (error) throw error;

        let csv = "Name,Date,Wake,Rounds,Study,Proof Link\n";
        data.forEach(r => {
            csv += `"${r.name}","${r.date}","${r.wake}","${r.rounds}","${r.study}","${r.photo || 'No Link'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sadhana_Export_${new Date().toLocaleDateString()}.csv`;
        a.click();
    } catch (err) {
        alert("Export failed: " + err.message);
    }
};

// 🔌 EVENT LISTENERS
document.getElementById("saveBtn").addEventListener("click", addData);
document.getElementById("exportBtn").addEventListener("click", exportToCSV);