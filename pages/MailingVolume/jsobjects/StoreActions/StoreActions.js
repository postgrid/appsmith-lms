export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
	//	await Save_Data.run({currentRow});
		//await get_printer_order_details.run(()			=> { showAlert('Well done!.','success')}, () => {});

	},runvolume: async () => {
		await get_VolumeByPrinters.run();
		await get_EOD_Summary.run();
		await get_mailing_volume.run();
	}
	
	/*,
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data2.run({currentRow});
		await get_printer_order_details.run(()			=> { }, showAlert('Well done!.','success')}, () => {});
	}*/
}
