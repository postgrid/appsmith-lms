export default {
			myFun1: async (currentRow) => {
			await storeValue("rowUpdate",currentRow);
			await Save_Data.run({currentRow});
			showAlert('Well done!.','success')
				
	},
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
	},
	runQuery: async (queryName) => {
		const queries = {
		"Query1": Query1,
		"Query2": Query2
		}
		await queries[queryName]?.run();
		await storeValue('tableData', queries[queryName].data)
	}
}
