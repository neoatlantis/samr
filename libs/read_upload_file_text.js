export default function read_upload_file_text(upload_el){
    let file = upload_el.files[0];
    if(!file) return null;

    return new Promise((resolve, reject)=>{
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            return resolve(evt.target.result);
        }
        reader.onerror = function (evt) {
            return reject();
        }
    });
}
