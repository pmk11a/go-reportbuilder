// Auto-generated seeder for dbbrowseconfigs
package seeders

import (
	"log"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

func seedDbBrowseConfigs(db *gorm.DB) {
	log.Println("Seeding dbbrowseconfigs...")

	// Clean existing records without dropping the table
	db.Exec("DELETE FROM dbbrowseconfigs")

	browseConfigs := []models.SDbBrowseConfig{

		{
			KodeBrowse: "81",
			TargetTable: strPtr("DBCUSTSUPP"),
			KeyField: strPtr("KODECUSTSUPP"),
			LabelField: strPtr("NAMACUSTSUPP"),
			Query: strPtr("Select KODECUSTSUPP,NAMACUSTSUPP,Alamat1+Char(13)+Alamat2+Char(13)+kota Alamat,TELPON,DiscMember from DBCUSTSUPP where IsMember = 1 and IsAktif = 1 Order by KODECUSTSUPP"),
			IsActive: 1,
		},

		{
			KodeBrowse: "157",
			TargetTable: strPtr("DbSubGroup"),
			KeyField: strPtr("KOdeSubGrp"),
			LabelField: strPtr("NamaSubGrp"),
			Query: strPtr("select KOdeSubGrp,NamaSubGrp from DbSubGroup where Kodegrp=0 order by KodeSubGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "911",
			TargetTable: strPtr("Dbbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg, a.Isi2,a.Sat1, a.Sat2 from Dbbarang a where a.isaktif=1 and KodeGrp=''BJ'' order by a.Kodebrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "912",
			TargetTable: strPtr("DbCustSupp"),
			KeyField: strPtr("KodeCustSupp"),
			LabelField: strPtr("NamaCustSupp"),
			Query: strPtr("select a.KodeCustSupp, a.NamaCustSupp from DbCustSupp a where a.isaktif=1 order by a.Kodecustsupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "913",
			TargetTable: strPtr("DBbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg, a.Isi2, a.NFix, Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) Kontrak from DBbarang a Left Outer join DBBARANGCUSTOMER B on B.kodebrg=A.Kodebrg and B.KodecustSupp='0' where a.isaktif=1 and A.KodeGrp like ''BJ%'' order by Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) DESC, a.Kodebrg ASC"),
			IsActive: 1,
		},

		{
			KodeBrowse: "914",
			TargetTable: strPtr("DBLokasi"),
			KeyField: strPtr("Lokasi"),
			LabelField: strPtr("Nama"),
			Query: strPtr("Select A.Lokasi from DBLokasi A where A.KodeGDG=0 Order by A.Lokasi"),
			IsActive: 1,
		},

		{
			KodeBrowse: "915",
			TargetTable: strPtr("Dbbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg from Dbbarang a where a.isaktif=1 order by a.Kodebrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "916",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGDg"),
			LabelField: strPtr("NamaGdg"),
			Query: strPtr("select KodeGDg,Nama NamaGdg from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "917",
			TargetTable: strPtr("Dbbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg from Dbbarang a where a.isaktif=1 order by a.Kodebrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "918",
			TargetTable: strPtr("Dbsubcustomer"),
			KeyField: strPtr("Kodesubcustomer"),
			LabelField: strPtr("Namasubcustomer"),
			Query: strPtr("select a.Kodesubcustomer ,a.Namasubcustomer from Dbsubcustomer a order by a.Kodesubcustomer"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1002",
			TargetTable: strPtr("dbbagian"),
			KeyField: strPtr("Kodebag"),
			LabelField: strPtr("Namabag"),
			Query: strPtr("select Kodebag,Namabag from dbbagian order by Kodebag"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1003",
			TargetTable: strPtr("dbjabatan"),
			KeyField: strPtr("KodeJab"),
			LabelField: strPtr("Namajab"),
			Query: strPtr("select KodeJab,Namajab from dbjabatan order by Kodejab"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1004",
			TargetTable: strPtr("dbDevisi"),
			KeyField: strPtr("Devisi"),
			LabelField: strPtr("NamaDevisi"),
			Query: strPtr("select Devisi,NamaDevisi from dbDevisi order by Devisi"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1005",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Perkiraan,Keterangan from dbPerkiraan where tipe=1 order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1006",
			TargetTable: strPtr("dbValas"),
			KeyField: strPtr("Kodevls"),
			LabelField: strPtr("NamaVls"),
			Query: strPtr("select Kodevls,NamaVls,Kurs from dbValas order by kodevls"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1007",
			TargetTable: strPtr("dbaruskas"),
			KeyField: strPtr("Kodeak"),
			LabelField: strPtr("Namaak"),
			Query: strPtr("select Kodeak,Namaak from dbaruskas order by kodeak"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1008",
			TargetTable: strPtr("dbKategori"),
			KeyField: strPtr("KodeKategori"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select KodeKategori,Keterangan from dbKategori Order by KodeKategori"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1014",
			TargetTable: strPtr("vwGroupCustSupp"),
			KeyField: strPtr("KodeCustSupp"),
			LabelField: strPtr("NamaCustSupp"),
			Query: strPtr("select X.KodeCustSupp, Y.NamaCustSupp, rtrim(ltrim(isnull(Y.Alamat1,'''')+case when isnull(Y.Alamat2,'''')='''' then '''' else '' ''+Y.Alamat2 end)) Alamat, Y.Kota from vwGroupCustSupp X, DBCUSTSUPP Y where X.KodeCustSupp=Y.KodeCustSupp and x.perkiraan ='0' and (Y.KodeCustSupp like ''%0%'' or Y.NamaCustSupp like ''%0%'') order by X.KodeCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1154",
			TargetTable: strPtr("vwBrowsCust"),
			KeyField: strPtr("KodeCust"),
			LabelField: strPtr("NamaCust"),
			Query: strPtr("select KodeCustSupp KodeCust, NamaCustSupp NamaCust, Alamat, Hari DueDate, JENIS,IsPpn from vwBrowsCust Group by KodeCustSupp, NamaCustSupp, Alamat, Hari , JENIS,IsPpn order by KodeCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1158",
			TargetTable: strPtr("dbSalesCustomer"),
			KeyField: strPtr("NamaSls"),
			LabelField: strPtr("Nama"),
			Query: strPtr("declare @namaSls varchar(30),@KOdeCUstSupp varchar(15) select @KOdeCUstSupp=0 set @namaSls=( select B.Nama NamaSls from dbSalesCustomer a Left Outer Join dbKaryawan b on b.KeyNik=A.KeyNik where A.KodecustSupp=@KOdeCUstSupp ) if isnull(@namaSls,'''')='''' begin select A.Keynik KodeSls, A.Nama NamaSls from dbKaryawan A where A.IsSales=1 order by A.Keynik End else Begin select A.Keynik KodeSls, B.Nama NamaSls from dbSalesCustomer a Left Outer Join dbKaryawan b on b.KeyNik=A.KeyNik where A.KodecustSupp=@KOdeCUstSupp order by A.Keynik End"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1250",
			TargetTable: strPtr("dbExpedisi"),
			KeyField: strPtr("KodeExp"),
			LabelField: strPtr("NamaExp"),
			Query: strPtr("select KodeExp,NamaExp, Alamat1, Alamat2, Kota from dbExpedisi order by KodeExp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1576",
			TargetTable: strPtr("dbKaryawan"),
			KeyField: strPtr("KeyNIK"),
			LabelField: strPtr("NIK"),
			Query: strPtr("select KeyNIK,NIK,Nama from dbKaryawan where Aktif=1 and KeyNIK not in (select KeyNIK from DBASM)"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1577",
			TargetTable: strPtr("dbKaryawan"),
			KeyField: strPtr("KeyNIK"),
			LabelField: strPtr("NIK"),
			Query: strPtr("select KeyNIK,NIK,Nama from dbKaryawan where IsSales=1 and Aktif=1 and KeyNIK not in (select KeyNIK from DBASM)"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2082",
			TargetTable: strPtr("dbValas"),
			KeyField: strPtr("KodeVls"),
			LabelField: strPtr("NamaVls"),
			Query: strPtr("select a.KodeVls, a.NamaVls, a.Kurs from dbValas a order by a.KodeVls"),
			IsActive: 1,
		},

		{
			KodeBrowse: "8005",
			TargetTable: strPtr("dbInvoicePL"),
			KeyField: strPtr("nobukti"),
			LabelField: strPtr("tanggal"),
			Query: strPtr("select a.nobukti, a.tanggal, '''' Keterangan, a.kodecustSupp,B.NoSo from dbInvoicePL a Left Outer join (Select nobukti,Sum(Qnt) Qnt,NoSo From dbinvoicePLDet x Group by nobukti,NoSo) b on b.nobukti=a.nobukti Left Outer join (Select noinvoice,Sum(Qnt) Qnt From dbRinvoicePLDet x Group by noinvoice) c on c.noinvoice=a.nobukti where Cast(Case when Case when A.IsOtorisasi1=1 then 1 else 0 end+ Case when A.IsOtorisasi2=1 then 1 else 0 end+ Case when A.IsOtorisasi3=1 then 1 else 0 end+ Case when A.IsOtorisasi4=1 then 1 else 0 end+ Case when A.IsOtorisasi5=1 then 1 else 0 end=A.MaxOL then 0 else 1 end As Bit)=0 and a.KodecustSupp='0' and B.Qnt-isnull(c.Qnt,0)>0 Order by a.nobukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "8006",
			TargetTable: strPtr("vwOutInvoicePL_RInvoicePL"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("Namabrg"),
			Query: strPtr("Select Kodebrg, Namabrg, QtySisa, Satuan, NetWSisa, GrossWSisa, SAT_1, SAT_2, Nosat, Isi, Urut, QntSisa, Qnt2Sisa, Harga, NamabrgKom from vwOutInvoicePL_RInvoicePL where nobukti=0 and NoSPB=0 Order by urut"),
			IsActive: 1,
		},

		{
			KodeBrowse: "8007",
			TargetTable: strPtr("dbSPB"),
			KeyField: strPtr("nobukti"),
			LabelField: strPtr("tanggal"),
			Query: strPtr("select nobukti, tanggal from dbSPB where noBukti='0' Order by nobukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "8013",
			TargetTable: strPtr("vwBrowsOutRJual"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select distinct A.NoBukti, D.Tanggal, B.NoSO, B.KodeCustSupp, C.NamaCust NamaCustSupp, C.Alamat, C.NamaKota Kota, '''' Catatan,'''' from vwBrowsOutRJual A Left Outer join DBRInvoicePL D on D.NoBukti=A.Nobukti Left outer join (Select x.NoBukti,x.Tanggal, x.KodeCustSupp, z.NOBUKTI NoSo, z1.KODESLS from dbInvoicePL x Left Outer join dbInvoicePLDet y on y.nobukti=x.nobukti left Outer join dbSPBDet SPB on SPB.NoBukti=y.NoSPB and SPB.Urut=y.UrutSPB left Outer join dbSPPDet o on o.NoBukti=SPB.NoSPP and o.Urut=SPB.UrutSPP left Outer join DBSODET z on z.NoBukti=o.NoSO and z.Urut=o.UrutSO left outer join DBSO z1 on z1.NOBUKTI=z.NOBUKTI Group by x.NoBukti,x.Tanggal, x.KodeCustSupp, z.NOBUKTI, z1.KODESLS ) B on B.NoBukti=A.Noinvoice left outer join vwBrowsCustomer C on C.KodeCust=B.KodeCustSupp and c.Sales=B.KODESLS order by D.Tanggal, A.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "8014",
			TargetTable: strPtr("dbSPBRjual"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select a.NoBukti, a.Tanggal, a.KodeCustSupp, B.NamaCustSupp, B.Alamat, C1.NOSPB, D.Tanggal TGLSPB, C1.Tipe,A.noRpj NoINv,a.FlagTipe,M1.Tanggal TglINv,m1.PONO,M1.ContractNo,M2.Tanggal TglSPBX,M4.TipeBayar,M4.Hari ,M1.Valas,M1.PPN,M1.Kurs from dbSPBRjual a left Outer join vwBrowsCust b on b.KodeCustSupp=A.kodecustSupp Left Outer join (Select nobukti, NoInvoice from DBRInvoicePLDET Group by nobukti, NoInvoice) C on C.nobukti=a.NoRPJ Left Outer join (Select NoSPB, NoBukti, 1 Tipe from dbInvoicePLDet group by NoSPB, NoBukti) C1 on C1.NoBukti=C.NoInvoice Left Outer Join DbInvoicePL M1 on A.NoRpj =M1.Nobukti left Outer join (Select Nobukti, Tanggal from DBSPB ) D on D.NoBukti=C1.NoSPB left Outer join (select Distinct(Nobukti),NOspp,tanggal from DbSPb) M2 on M1.ContractNo=M2.Nobukti Left Outer join (select Distinct(Nobukti),NOship from DbSPP) M3 on M2.NOSPP=M3.NObukti Left Outer join (select Distinct(Nobukti),tipebayar,hari from DBSO) M4 on M3.NOSHIP=M4.NObukti where Cast(Case when Case when A.IsOtorisasi1=1 then 1 else 0 end+ Case when A.IsOtorisasi2=1 then 1 else 0 end+ Case when A.IsOtorisasi3=1 then 1 else 0 end+ Case when A.IsOtorisasi4=1 then 1 else 0 end+ Case when A.IsOtorisasi5=1 then 1 else 0 end=A.MaxOL then 0 else 1 end As Bit)=0 And A.KodeCustSupp=0 and A.FlagTipe=0 order by a.nobukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "9111",
			TargetTable: strPtr("DbArea"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select * from DbArea order by KodeArea"),
			IsActive: 1,
		},

		{
			KodeBrowse: "9131",
			TargetTable: strPtr("DBbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg, a.Isi2, a.NFix, Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) Kontrak from DBbarang a Left Outer join DBBARANGCUSTOMER B on B.kodebrg=A.Kodebrg and B.KodecustSupp='0' where a.isaktif=1 and A.KodeGrp like ''BJP%'' and a.KodeBrg like ''%0.%'' order by Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) DESC, a.Kodebrg ASC"),
			IsActive: 1,
		},

		{
			KodeBrowse: "9132",
			TargetTable: strPtr("DBbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg, a.Isi2, a.NFix, Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) Kontrak from DBbarang a Left Outer join DBBARANGCUSTOMER B on B.kodebrg=A.Kodebrg where a.isaktif=1 and A.KodeGrp like ''BJP%'' and a.KodeBrg like ''%0.%'' order by Cast(Case when B.KodeBrg is null then 0 Else 1 end as bit) DESC, a.Kodebrg ASC"),
			IsActive: 1,
		},

		{
			KodeBrowse: "9149",
			TargetTable: strPtr("DBbarang"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.Kodebrg, a.NamaBrg, a.Sat1,a.isi1,a.sat2,a.Isi2,a.nfix from DBbarang a where a.isaktif=1 and A.KodeGrp<>''BJ'' and dbo.cekGudanglLpb(a.KODEBRG )='0' Order by a.Kodebrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10021",
			TargetTable: strPtr("dbDepart"),
			KeyField: strPtr("KdDep"),
			LabelField: strPtr("NmDep"),
			Query: strPtr("select KdDep,NmDep from dbDepart order by KdDep"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10051",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select a.Perkiraan,a.Keterangan from dbPerkiraan a left Outer join dbAksesPerkiraan b on b.perkiraan=a.Perkiraan where a.tipe=1 and a.Perkiraan<>0 and b.Userid='0' and (a.Keterangan like ''%0%'' or a.Perkiraan like ''%0%'') order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10052",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Perkiraan,Keterangan from dbPerkiraan where Kelompok >1 order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10053",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Perkiraan,Keterangan from dbPerkiraan where tipe=1 and kelompok=3 order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10054",
			TargetTable: strPtr("dbLRHPP"),
			KeyField: strPtr("Nomor"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Nomor, Keterangan from dbLRHPP where IsLRHPP=0 and Bulan=0 and Tahun=0 order by Nomor"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10055",
			TargetTable: strPtr("DBPERKIRAAN"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select A.Perkiraan,A.Keterangan From DBPERKIRAAN A left Outer join DBAKSESPERKIRAAN B on B.Perkiraan=A.Perkiraan left Outer join DBPOSTHUTPIUT C on C.Perkiraan=A.Perkiraan where B.UserID='0' and C.Kode=0 Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10056",
			TargetTable: strPtr("DBPERKIRAAN"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select A.Perkiraan,A.Keterangan From DBPERKIRAAN A left Outer join DBAKSESPERKIRAAN B on B.Perkiraan=A.Perkiraan left Outer join DBPOSTHUTPIUT C on C.Perkiraan=A.Perkiraan where B.UserID='0' and C.Kode<>0 Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10057",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Perkiraan, Keterangan from dbPerkiraan where Tipe=1 and Perkiraan Like ''153%'' order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10059",
			TargetTable: strPtr("DBPERKIRAAN"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select A.Perkiraan,A.Keterangan From DBPERKIRAAN A left Outer join DBAKSESPERKIRAAN B on B.Perkiraan=A.Perkiraan left Outer join DBPOSTHUTPIUT C on C.Perkiraan=A.Perkiraan where B.UserID='0' Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10071",
			TargetTable: strPtr("dbaruskasdet"),
			KeyField: strPtr("Kodesubak"),
			LabelField: strPtr("Namasubak"),
			Query: strPtr("select Kodesubak,Namasubak from dbaruskasdet where kodeak=0 order by Kodesubak"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10081",
			TargetTable: strPtr("dbKategoriBrgJadi"),
			KeyField: strPtr("KodeKategori"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select KodeKategori, Keterangan from dbKategoriBrgJadi Order by KodeKategori"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10141",
			TargetTable: strPtr("vwBrowsSupp"),
			KeyField: strPtr("KodeCustsupp"),
			LabelField: strPtr("NamaCust"),
			Query: strPtr("select a.KodeCustsupp, a.NamaCustSupp NamaCust, A.Alamat, A.Telpon from vwBrowsSupp A where a.isaktif=1 Order by a.kodecustsupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10142",
			TargetTable: strPtr("vwBrowscust"),
			KeyField: strPtr("KodeCustsupp"),
			LabelField: strPtr("NamaCust"),
			Query: strPtr("select a.KodeCustsupp, a.NamaCustSupp NamaCust, A.Alamat, A.Telpon from vwBrowscust A where a.isaktif=1 Order by a.kodecustsupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "10143",
			TargetTable: strPtr("vwBrowsExpedisi"),
			KeyField: strPtr("KodeCustsupp"),
			LabelField: strPtr("NamaCust"),
			Query: strPtr("select a.KodeCustsupp, a.NamaCustSupp NamaCust, A.Alamat, A.Telpon from vwBrowsExpedisi A where a.isaktif=1 Order by a.kodecustsupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11001",
			TargetTable: strPtr("dbValas"),
			KeyField: strPtr("KodeVls"),
			LabelField: strPtr("NamaVls"),
			Query: strPtr("select a.KodeVls, a.NamaVls, a.Kurs from dbValas a order by a.KodeVls"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11002",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGdg"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select KodeGdg,Nama,Alamat from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11003",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select * from dbGudang where Nama Like ''%Bahan%'' order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11004",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select * from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11009",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGdg"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select KodeGdg, Nama from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "11542",
			TargetTable: strPtr("vwAlamatCust"),
			KeyField: strPtr("Nomor"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select Nomor, Nama, ALamat AlamatKirim, '''' KodeExp, '''' NamaExp from vwAlamatCust where KodeCustsupp='0' order by Nomor"),
			IsActive: 1,
		},

		{
			KodeBrowse: "15779",
			TargetTable: strPtr("dbKaryawan"),
			KeyField: strPtr("KeyNIK"),
			LabelField: strPtr("NIK"),
			Query: strPtr("select KeyNIK,NIK,Nama from dbKaryawan where Aktif=1 and KeyNIK not in (select KeyNIK from DBASM)"),
			IsActive: 1,
		},

		{
			KodeBrowse: "15780",
			TargetTable: strPtr("dbKaryawan"),
			KeyField: strPtr("KeyNIK"),
			LabelField: strPtr("NIK"),
			Query: strPtr("select KeyNIK,a.NIK,Nama,tarif from dbKaryawan a left outer join dbtariftenaker b on b.nik=a.nik where Aktif=1 and Produksi<>0"),
			IsActive: 1,
		},

		{
			KodeBrowse: "20011",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select Perkiraan, Keterangan, Simbol from dbPerkiraan where Tipe=1 and Perkiraan in (select Perkiraan from dbPostHutPiut where Kode='0') and (Perkiraan like ''%0%'' or Keterangan like ''%0%'')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "20012",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select Perkiraan, Keterangan, Simbol from dbPerkiraan where Tipe=1 and Perkiraan in (select Perkiraan from dbPostHutPiut where Kode=''KAS'')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "23201",
			TargetTable: strPtr("DBPO"),
			KeyField: strPtr("Urut"),
			LabelField: strPtr("KodeBrg"),
			Query: strPtr("select min(A.Urut) Urut, A.KodeBrg, case when ketbrg ='''' then Br.NamaBrg else ketbrg end namabrg, A.NoSat, case when A.NOSAT=1 then Br.SAT1 else Br.SAT2 end Satuan, case when A.NOSAT=1 then 1 else Br.ISI2 end Isi, Br.Isi1, Br.Isi2, sum(A.QntOut) QntSisa , '''' NFix,ketbrg from ( select A.NoBukti, A.Tanggal, B.Urut, B.KODEBRG, B.NOSAT, B.Qnt, B.Qnt QntOut, B.HARGA,ketbrg from DBPO A, DBPODET B where A.NOBUKTI=B.NOBUKTI and A.NOBUKTI='0' union all select A.NoBukti, A.Tanggal, 99999 Urut, B.KODEBRG, B.NOSAT, 0.00 Qnt, -B.QNT QntOut, 0.00 Harga, '''' Ketbrg from DBPO A, DBBELIDET B where A.NOBUKTI=B.NoPO and A.NOBUKTI='0' ) A left outer join DBBARANG Br on Br.KODEBRG=A.KODEBRG group by A.NOBUKTI, A.TANGGAL, A.KODEBRG, Br.NAMABRG, A.NOSAT, Br.SAT1, Br.SAT2, Br.ISI1, Br.ISI2, a.ketbrg having sum(A.QntOut)>0 order by min(A.Urut)"),
			IsActive: 1,
		},

		{
			KodeBrowse: "23301",
			TargetTable: strPtr("DBBELIDET"),
			KeyField: strPtr("pphp"),
			LabelField: strPtr("URUT"),
			Query: strPtr("Select A.pphp,A.URUT, A.KODEBRG, Br.NAMABRG, A.NOSAT, A.ISI, A.SATUAN, A.QntTerima, A.QntTerima-Sum(Case when A.NOSAT=1 then Case when B.NOSAT=1 then B.QntReject when B.NOSAT=2 then B.QntReject*Br.ISI2 else 0 end when A.NOSAT=2 then Case when B.NOSAT=1 then B.QntReject/Br.ISI2 when B.NOSAT=2 then B.QntReject else 0 end else 0 end)-isnull(D.Qnt,0) Qnt, A.Qnt1Terima-Sum(Case when A.NOSAT=1 then Case when B.NOSAT=1 then B.Qnt1Reject when B.NOSAT=2 then B.Qnt1Reject else 0 end when A.NOSAT=2 then Case when B.NOSAT=1 then B.Qnt1Reject when B.NOSAT=2 then B.Qnt1Reject else 0 end else 0 end)-isnull(D.Qnt1,0) Qnt1, A.Qnt2Terima-Sum(Case when A.NOSAT=1 then Case when B.NOSAT=1 then B.Qnt2Reject when B.NOSAT=2 then B.Qnt2Reject else 0 end when A.NOSAT=2 then Case when B.NOSAT=1 then B.Qnt2Reject when B.NOSAT=2 then B.Qnt2Reject else 0 end else 0 end)-isnull(D.Qnt2,0) Qnt2, Br.NFixfrom (Select PphP,urut, kodebrg, QNT, QntTerima,Qnt1Terima, Qnt2Terima, NOSAT, ISI, SATUAN, NOBUKTI from DBBELIDET where QntTerima<>0) A Left Outer join (Select urut, kodebrg, QNT, QntReject, Qnt1Reject, Qnt2Reject, NOSAT, ISI, SATUAN, NOBUKTI from DBBELIDET where Qnt1Reject<>0) B on B.NOBUKTI=A.NOBUKTI and B.KODEBRG=A.KODEBRG left outer join DBBARANG Br on Br.KODEBRG=A.KODEBRG Left Outer join (Select x.NOPBL, x.URUTPBL, SUM(x.QNT) Qnt, SUM(x.Qnt1) Qnt1, SUM(x.Qnt2) Qnt2 from DBRBELIDET x group by x.NOPBL, x.URUTPBL) D on D.NOPBL=A.NOBUKTI and D.URUTPBL=A.URUTwhere A.NoBukti='0'Group by a.pphp,A.URUT, A.KODEBRG, Br.NAMABRG, A.NOSAT, A.ISI, A.SATUAN, Br.NFix, A.QntTerima, A.Qnt1Terima, A.Qnt2Terima,D.Qnt,D.Qnt1, D.Qnt2Having A.QntTerima-Sum(Case when A.NOSAT=1 then Case when B.NOSAT=1 then B.QntReject when B.NOSAT=2 then B.QntReject*Br.ISI2 else 0 end when A.NOSAT=2 then Case when B.NOSAT=1 then B.QntReject/Br.ISI2 when B.NOSAT=2 then B.QntReject else 0 end else 0 end)-isnull(D.Qnt,0)>0order by A.Urut"),
			IsActive: 1,
		},

		{
			KodeBrowse: "23302",
			TargetTable: strPtr("dbBeli"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select A.NoBukti, A.Tanggal from dbBeli A where A.KodeSupp='0' and (a.NoBukti like ''%0%'') and Cast(Case when Case when A.IsOtorisasi1=1 then 1 else 0 end+ Case when A.IsOtorisasi2=1 then 1 else 0 end+ Case when A.IsOtorisasi3=1 then 1 else 0 end+ Case when A.IsOtorisasi4=1 then 1 else 0 end+ Case when A.IsOtorisasi5=1 then 1 else 0 end=A.MaxOL then 0 else 1 end As Bit)=0 order by A.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "30056",
			TargetTable: strPtr("DBTIPETRANS"),
			KeyField: strPtr("KODETIPE"),
			LabelField: strPtr("KODESUBTIPE"),
			Query: strPtr("Select A.KODETIPE,B.KODESUBTIPE,B.Nama from DBTIPETRANS A Left Outer join DBSUBTIPETRANS B on B.KODETIPE=A.KODETIPE where A.KodeTipe=0 Order by A.KODETIPE,B.KODESUBTIPE"),
			IsActive: 1,
		},

		{
			KodeBrowse: "30057",
			TargetTable: strPtr("DBTIPETRANS"),
			KeyField: strPtr("KODETIPE"),
			LabelField: strPtr("Nama"),
			Query: strPtr("Select A.KODETIPE,A.Nama from DBTIPETRANS A where isJasaBeliJual=0 Order by A.KODETIPE"),
			IsActive: 1,
		},

		{
			KodeBrowse: "40801",
			TargetTable: strPtr("where"),
			KeyField: strPtr("Kode"),
			LabelField: strPtr("Nama"),
			Query: strPtr("Select From where tanggal between 0 and 0 Order By"),
			IsActive: 1,
		},

		{
			KodeBrowse: "40802",
			TargetTable: strPtr("where"),
			KeyField: strPtr("Kode"),
			LabelField: strPtr("Nama"),
			Query: strPtr("Select From where tanggal between 0 and 0 Order By"),
			IsActive: 1,
		},

		{
			KodeBrowse: "50402",
			TargetTable: strPtr("dbBOM"),
			KeyField: strPtr("KodeBOM"),
			LabelField: strPtr("IsDefault"),
			Query: strPtr("select KodeBOM, IsDefault from dbBOM where KodeBrg='0' order by KodeBOM"),
			IsActive: 1,
		},

		{
			KodeBrowse: "80131",
			TargetTable: strPtr("dbInvoicePLDet"),
			KeyField: strPtr("Kodebrg"),
			LabelField: strPtr("NAMABRG"),
			Query: strPtr("select A.Kodebrg,C.NAMABRG, Case when A.NOSAT=1 then A.SAT_1 When A.NOSAT=2 Then A.SAT_2 End Satuan, Case When A.NOSAT=1 then A.QNT When A.NOSAT=2 then A.QNT2 End Qnt, A.QNT QNT1,A.QNT2 QNT2,B.Noinv,A.Urut UrutINv,A.Sat_1,A.Sat_2 ,A.ISI ,A.Qnt - Isnull(B.QNT1,0) QntSisa,A.Qnt2 - Isnull(B.QNT2,0) Qnt2Sisa,A.NOsat from dbInvoicePLDet A Left OUter Join ( select NoINV,UrutINV,KodeBrg,SUM(ISNULL(QNT,0)) Qnt1,SUM(ISNULL(QNT2,0)) Qnt2 from dbSPBRJualDet Group By NoINV,UrutINV,KodeBrg ) B on A.NoBukti=B.NoINV and A.Urut=B.UrutINV Left OUter join DBBARANG C on A.KodeBrg =C.KodeBrg Where (A.QNT-isnull(B.Qnt1,0)>0 or A.QNT2 - isnull(B.Qnt2,0)>0) And A.Nobukti=0 order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "80141",
			TargetTable: strPtr("dbSPBRJualDet"),
			KeyField: strPtr("NOSPR"),
			LabelField: strPtr("UrutSPR"),
			Query: strPtr("Declare @noBukti Varchar(30)Set @Nobukti=0elect A.KODEBRG, B.NAMABRG, A.NoSat, A.Qnt2-isnull(C.Qnt2,0) Qnt2Sisa, A.Sat_2, A.Qnt-isnull(C.Qnt,0) QntSisa, A.Sat_1, A.Isi, A.NoBukti, A.Urut,M1.Harga from dbSPBRJualDet A left outer join dbBarang B on B.KodeBrg=A.KodeBrg left outer join (select NOSPR, UrutSPR, sum(Qnt2) Qnt2, sum(Qnt) Qnt from DBINVOICERPJDet where NOSPR=@Nobukti group by NOSPR, UrutSPR) C on C.NOSPR=A.NoBukti and C.UrutSPR=A.Urut Left OUter join dbInvoicePLDet M1 on A.Noinv = M1.Nobukti and A.urutINv=M1.urut where A.NoBukti=@Nobukti and ((A.Qnt2-isnull(C.Qnt2,0))>0 or (A.Qnt-isnull(C.Qnt,0))>0) order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91111",
			TargetTable: strPtr("DbKota"),
			KeyField: strPtr("*"),
			LabelField: strPtr("NamaArea"),
			Query: strPtr("select A.*,NamaArea from DbKota A Left Outer join DBArea B on A.kodearea=B.KodeAreA order by KodeKota"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91112",
			TargetTable: strPtr("DbjenisCustSupp"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("Select * from DbjenisCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91113",
			TargetTable: strPtr("DbProses"),
			KeyField: strPtr("KodePrs"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("Select KodePrs,Keterangan from DbProses"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91114",
			TargetTable: strPtr("DBMesin"),
			KeyField: strPtr("KodeMsn"),
			LabelField: strPtr("Ket"),
			Query: strPtr("Select KodeMsn,Ket,kapasitas,Tarif from DBMesin"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91115",
			TargetTable: strPtr("DBPERKIRAAN"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select Perkiraan, Keterangan from DBPERKIRAAN where Kelompok = 4"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91116",
			TargetTable: strPtr("DBJADWALPRD"),
			KeyField: strPtr("KODEMSN"),
			LabelField: strPtr("Ket"),
			Query: strPtr("select a.KODEMSN,b.Ket,a.Tanggal,tarif,a.urut from DBJADWALPRD a left outer join DBMesin b on b.KodeMsn= a.KODEMSN left outer join DBHASILPRDDET c on c.NOSPK = a.NOSPK and c.KODEMSN = a.KODEMSN and c.urutmesin =a.urut where c.KodeMsn is null"),
			IsActive: 1,
		},

		{
			KodeBrowse: "91117",
			TargetTable: strPtr("dbspk"),
			KeyField: strPtr("nobukti"),
			LabelField: strPtr("kodebrg"),
			Query: strPtr("select a.nobukti,a.kodebrg,namabrg,noso,namacustsupp from dbspk a left outer join dbbarang b on b.kodebrg=a.kodebrg left outer join dbso c on c.nobukti=a.noso left outer join dbcustsupp d on d.kodecustsupp =c.kodecust"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100101",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGdg"),
			LabelField: strPtr("NamaGdg"),
			Query: strPtr("select distinct a.KodeGdg, a.Nama NamaGdg, a.IsRusak from dbGudang a left outer join dbPemakaiGdg b on b.kodegdg=a.kodegdg where A.Kodegdg<>'0' order by a.KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100400",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select Perkiraan,keterangan from dbPerkiraan where tipe=1 and perkiraan not in (select Perkiraan from dbposthutpiut) order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100401",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''AKV'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100402",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''AKM'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100403",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''KAS'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100404",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''BANK'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100405",
			TargetTable: strPtr("dbGiro"),
			KeyField: strPtr("Bank"),
			LabelField: strPtr("Nogiro"),
			Query: strPtr("Select Bank, Nogiro, TglGiro, Case when kodevls=''IDR'' then KreditRp else Kredit end jumlah, KodeVls, Kurs, Keterangan from dbGiro where Tipe=''HT'' and TglCair is null and (NoGiro like '%') Order by Bank, Nogiro, TglGiro"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100406",
			TargetTable: strPtr("dbGiro"),
			KeyField: strPtr("Bank"),
			LabelField: strPtr("Nogiro"),
			Query: strPtr("Select Bank, Nogiro, TglGiro, Case when kodevls=''IDR'' then DebetRp else Debet end jumlah, KodeVls, Kurs, Keterangan from dbGiro where Tipe=''PT'' and TglCair is null Order by Bank, Nogiro, TglGiro"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100407",
			TargetTable: strPtr("DBAktiva"),
			KeyField: strPtr("Devisi"),
			LabelField: strPtr("NamaBag"),
			Query: strPtr("Select A.Devisi,b.NamaBag,A.Perkiraan, A.Keterangan,A.Tanggal, Case when A.Tipe=''L'' then ''[L]urus'' when A.Tipe=''M'' then ''[M]enurun'' when A.Tipe=''P'' then ''[P]ajak'' else '''' end Metode,A.Persen,A.Quantity,A.Kodebag, A.Akumulasi, D.Keterangan NamaAkumulasi, A.Nomuka,C.Keterangan NamaGroupAktiva,A.noBelakang,A.NoBelakang2, A.Biaya,a.biaya2,a.persenbiaya1,a.persenbiaya2, E.NamaDevisi,a.TipeAktiva,a.Kelompok From DBAktiva A left outer join dbBagian b on b.kodebag=a.kodebag left outer join dbperkiraan c on c.perkiraan=a.Nomuka and c.tipe=1 left outer join dbperkiraan d on d.perkiraan=a.Akumulasi and d.Tipe=1 left outer join dbDevisi e on e.Devisi=a.Devisi Where A.NoMuka=0 or A.Akumulasi=0 Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100408",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''PT'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100409",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''HT'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100410",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan,b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode=''DP'' order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100411",
			TargetTable: strPtr("dbDeposito"),
			KeyField: strPtr("Bank"),
			LabelField: strPtr("NoDeposito"),
			Query: strPtr("Select Bank, NoDeposito, TglJatuhTempo, Case when kodevls=''IDR'' then DebetRp else Debet end jumlah, KodeVls, Kurs, Keterangan from dbDeposito where TglCair is null Order by Bank, NoDeposito, TgljatuhTempo"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100412",
			TargetTable: strPtr("DBAktiva"),
			KeyField: strPtr("Devisi"),
			LabelField: strPtr("NamaBag"),
			Query: strPtr("Select A.Devisi,b.NamaBag,A.Perkiraan, A.Keterangan,A.Tanggal, Case when A.Tipe=''L'' then ''[L]urus'' when A.Tipe=''M'' then ''[M]enurun'' when A.Tipe=''P'' then ''[P]ajak'' else '''' end Metode,A.Persen,A.Quantity,A.Kodebag, A.Akumulasi, D.Keterangan NamaAkumulasi, A.Nomuka,C.Keterangan NamaGroupAktiva,A.noBelakang,A.NoBelakang2, A.Biaya,a.biaya2,a.persenbiaya1,a.persenbiaya2, E.NamaDevisi,a.TipeAktiva From DBAktiva A left outer join dbBagian b on b.kodebag=a.kodebag left outer join dbperkiraan c on c.perkiraan=a.Nomuka and c.tipe=1 left outer join dbperkiraan d on d.perkiraan=a.Akumulasi and d.Tipe=1 left outer join dbDevisi e on e.Devisi=a.Devisi Where A.NoMuka=0 and A.Kelompok=0Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100413",
			TargetTable: strPtr("DBAktiva"),
			KeyField: strPtr("Devisi"),
			LabelField: strPtr("NamaBag"),
			Query: strPtr("Select A.Devisi,b.NamaBag,A.Perkiraan, A.Keterangan,A.Tanggal, Case when A.Tipe=''L'' then ''[L]urus'' when A.Tipe=''M'' then ''[M]enurun'' when A.Tipe=''P'' then ''[P]ajak'' else '''' end Metode,A.Persen,A.Quantity,A.Kodebag, A.Akumulasi, D.Keterangan NamaAkumulasi, A.Nomuka,C.Keterangan NamaGroupAktiva,A.noBelakang,A.NoBelakang2, A.Biaya,a.biaya2,a.persenbiaya1,a.persenbiaya2, E.NamaDevisi,a.TipeAktiva From DBAktiva A left outer join dbBagian b on b.kodebag=a.kodebag left outer join dbperkiraan c on c.perkiraan=a.Nomuka and c.tipe=1 left outer join dbperkiraan d on d.perkiraan=a.Akumulasi and d.Tipe=1 left outer join dbDevisi e on e.Devisi=a.Devisi Where A.Kelompok=0Order by A.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100414",
			TargetTable: strPtr("dbposthutpiut"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select a.Perkiraan, b.keterangan from dbposthutpiut a left outer join dbperkiraan b on b.perkiraan=a.perkiraan where a.Kode in (''HT'',''PT'',''UHT'',''UPT'') and a.Perkiraan not in (Select Perkiraan from dbperkcustsupp where kodecustsupp='0') order by a.Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "100444",
			TargetTable: strPtr("dbPerkiraan"),
			KeyField: strPtr("Perkiraan"),
			LabelField: strPtr("keterangan"),
			Query: strPtr("select Perkiraan,keterangan from dbPerkiraan where tipe=1 order by Perkiraan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "101411",
			TargetTable: strPtr("DBHASILPRD"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("BrgJ"),
			Query: strPtr("Select A.NoBukti,A.KodeBrg BrgJ,E.NamaBrg NamaBrgJ ,A.Qnt QntJ,A.Nosat NosatJ,A.Isi IsiJ,A.Satuan SatJ, ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) QntH, A.QNT- ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) SisaSPK From [vwSPK] A Left Outer join dbBarang E on E.KodeBrg=A.Kodebrg Left Outer join (Select y.NoSPK,y.KODEBRG, y.KodeGdg ,Sum( y.QNT*y.ISI)QntHasilPrd from DBHASILPRD x left Outer join DBHASILPRDDET y on y.NOBUKTI=x.NOBUKTI Group by y.NoSPK,y.KODEBRG, y.KodeGdg) B on B.NoSPK=A.NOBUKTI and B.KODEBRG=A.KODEBRG"),
			IsActive: 1,
		},

		{
			KodeBrowse: "101412",
			TargetTable: strPtr("DBHASILPRD"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("noso"),
			Query: strPtr("Select A.NoBukti,A.noso,A.KodeBrg BrgJ,E.NamaBrg + '' '' + a.namacustsupp NamaBrgJ ,A.Qnt QntJ,A.Nosat NosatJ,A.Isi IsiJ,A.Satuan SatJ, ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) QntH, A.QNT- ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) SisaSPK,tglselesai From [vwSPK] A Left Outer join dbBarang E on E.KodeBrg=A.Kodebrg Left Outer join (Select y.isclosespk,y.NoSPK,y.KODEBRG, y.KodeGdg ,Sum( y.QNT*y.ISI)QntHasilPrd from DBHASILPRD x left Outer join DBHASILPRDDET y on y.NOBUKTI=x.NOBUKTI Group by y.NoSPK,y.KODEBRG, y.KodeGdg,isclosespk) B on B.NoSPK=A.NOBUKTI and B.KODEBRG=A.KODEBRG where isnull(isclosespk,0)=0 and a.qnt - ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0)>0 Order by A.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110011",
			TargetTable: strPtr("dbSubGroup"),
			KeyField: strPtr("KodeSubGrp"),
			LabelField: strPtr("NamaSubGrp"),
			Query: strPtr("select a.KodeSubGrp,a.NamaSubGrp from dbSubGroup a Left Outer Join dbGroup b on a.KodeGrp=b.KodeGrp where a.KodeGrp Not in(''BJ'',''BU'') and (KodeSubGrp Like ''%0%'' or NamaSubGrp Like ''%0%'') order by a.KodeSubGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110012",
			TargetTable: strPtr("dbGroup"),
			KeyField: strPtr("Nama"),
			LabelField: strPtr("KodeGrp"),
			Query: strPtr("select Nama,KodeGrp from dbGroup where KodeGrp Like ''%0%'' order by KodeGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110013",
			TargetTable: strPtr("dbGroup"),
			KeyField: strPtr("KodeGrp"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select a.KodeGrp,a.Nama from dbGroup a where KodeGrp =0 order by a.KodeGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110014",
			TargetTable: strPtr("dbSubGroup"),
			KeyField: strPtr("KodeGrp"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select a.KodeGrp,b.Nama,a.KodeSubGrp,a.NamaSubGrp from dbSubGroup a Left Outer Join dbGroup b on a.KodeGrp=b.KodeGrp where a.Kodegrp='0' and (a.KodeSubGrp Like ''%0%'' or a.NamaSubGrp Like ''%0%'') order by a.KodeSubGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110015",
			TargetTable: strPtr("DBJNSTambahan"),
			KeyField: strPtr("KodeJnsTambahan"),
			LabelField: strPtr("NAMA"),
			Query: strPtr("select KodeJnsTambahan, NAMA from DBJNSTambahan"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110016",
			TargetTable: strPtr("DBBARANG"),
			KeyField: strPtr("KODEBRG"),
			LabelField: strPtr("NAMABRG"),
			Query: strPtr("select KODEBRG, NAMABRG from DBBARANG A where A.Kodegrp Not in('BJ','BU')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110021",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGdg"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select KodeGdg,Nama,Alamat from dbGudang where Kodegdg Not in(Select Kodegdg From dbFlPass where UserID='0') order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110022",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("KodeGdg"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select KodeGdg,Nama,Alamat from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110091",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select * from dbGudang where ISProduksi=0 order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "110701",
			TargetTable: strPtr("DBPERKCUSTSUPP"),
			KeyField: strPtr("KodeCustSupp"),
			LabelField: strPtr("NamaCustSupp"),
			Query: strPtr("select X.KodeCustSupp, Y.NamaCustSupp, rtrim(ltrim(isnull(Y.Alamat1,'''')+case when isnull(Y.Alamat2,'''')='''' then '''' else '' ''+Y.Alamat2 end)) Alamat, Y.Kota,x.PERKIRAAN ,PPN,Hari,PPN,isppn from (select A.KodeCustSupp,a.Perkiraan from DBPERKCUSTSUPP A, DBPOSTHUTPIUT B where B.Perkiraan=A.Perkiraan and B.Kode='0' group by A.KodeCustSupp,a.Perkiraan ) X, DBCUSTSUPP Y where X.KodeCustSupp=Y.KodeCustSupp and (Y.KodeCustSupp like ''%0%'' or Y.NamaCustSupp like ''%0%'') order by X.KodeCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "120302",
			TargetTable: strPtr("vwBarang"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select A.KodeBrg, A.NamaBrg, A.Sat1, A.Sat2, A.Isi1, A.Isi2, A.NFix from vwBarang A where (A.IsBarang=1 or A.IsBarang=2) and A.IsAktif=1 and (A.KodeBrg like ''%0%'' or A.NamaBrg like ''%0%'') order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "120303",
			TargetTable: strPtr("VwBSTB"),
			KeyField: strPtr("NoSO"),
			LabelField: strPtr("NoBukti"),
			Query: strPtr("select NoSO,NoBukti ,KodeBrg,Namabrg ,QNT ,SAT_1 from VwBSTB A where kodecustsupp = '0'"),
			IsActive: 1,
		},

		{
			KodeBrowse: "232011",
			TargetTable: strPtr("dbbarang"),
			KeyField: strPtr("kodebrg"),
			LabelField: strPtr("namabrg"),
			Query: strPtr("select kodebrg,namabrg,namasubgrp,perkpers from dbbarang a left outer join dbsubgroup b on b.kodesubgrp =a.kodesubgrp where a.kodegrp=''BLB''"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242011",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select Isnull(NFix,0)Nfix,Isi2,A.KodeBrg,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A left Outer Join (select a.KodeGdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where A.KodeGrp in (''BJB'',''BJP'')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242012",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("Select A.KodeBrg, A.NamaBrg, Isnull(Sisa,0) QntSaldo,QntBPPB,Stock from dbBarang A left outer join (select a.Kodebrg,0.00 QntBPPB,Isnull(b.Qnt,0)Stock,0.00 Sisa from DBBPPBDET a left Outer Join (select Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg where Bulan= and Tahun= group by kodebrg)b On b.kodebrg=a.KodeBrg group by a.KodeBrg,b.Qnt)b On a.KODEBRG=b.Kodebrg where a.isAktif=1 and (a.KodeBrg like ''%0%'' or a.NamaBrg like ''%0%'') and a.KodeGrp not in (''BJ'',''BU'') order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242013",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select Isnull(NFix,0)Nfix,Isi2,A.KodeBrg,kodebhn,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A left Outer Join (select a.KodeGdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where A.KodeGrp not in (''BJP'')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242014",
			TargetTable: strPtr("DBPPLDET"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select a.NoBukti from DBPPLDET a Left Outer Join (select NoPPL,Kodebrg,SUM(Qnt*isi)Qnt from DBPODET group by NoPPL,Kodebrg)b On a.Nobukti=b.NoPPL and a.kodebrg=b.KODEBRG left Outer Join DBBARANG c On c.KODEBRG=a.kodebrg group by a.NoBukti,b.Qnt having SUM(a.Qnt*isi)-Isnull(b.Qnt,0)<>0"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242015",
			TargetTable: strPtr("vwOutPPL"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("NamaBrg"),
			Query: strPtr("select a.KodeBrg, a.NamaBrg, a.Sat, a.NoSat, a.Isi, a.Qnt, a.QntPO, a.SisaPPL, a.NoBukti, a.Urut,a.tolerate,a.proses isjasa,NamaBarang,perkiraan from vwOutPPL a where perkiraan= '0'order by a.KodeBrg, a.NoSat, a.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242016",
			TargetTable: strPtr("DBPenyerahanBhnDET"),
			KeyField: strPtr("Nobukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select A.Nobukti, C.Tanggal , NospkFrom DBPenyerahanBhnDET A left outer join (Select x.NoPenyerahanBHN, SUM(x.Qnt) Qnt, SUM(x.Qnt2) Qnt2 from DBRPenyerahanBhnDET x left outer join DBRPenyerahanBhn y on y.Nobukti=x.Nobukti Group by x.NoPenyerahanBHN) B on B.NoPenyerahanBHN=A.Nobukti left outer join DBPenyerahanBhn c on c.Nobukti=A.Nobuktiwhere Cast(Case when Case when C.IsOtorisasi1=1 then 1 else 0 end+ Case when C.IsOtorisasi2=1 then 1 else 0 end+ Case when C.IsOtorisasi3=1 then 1 else 0 end+ Case when C.IsOtorisasi4=1 then 1 else 0 end+ Case when C.IsOtorisasi5=1 then 1 else 0 end=C.MaxOL then 0 else 1 end As Bit)=0 and ((A.Qnt-isnull(B.Qnt,0)>0) or (A.Qnt2-isnull(B.Qnt2,0)>0)) and C.IsSampel=:intparam"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242017",
			TargetTable: strPtr("DBPenyerahanBhnDET"),
			KeyField: strPtr("Nobukti"),
			LabelField: strPtr("urut"),
			Query: strPtr("Select A.Nobukti, A.urut, A.kodebrg, d.NAMABRG, A.Qnt,A.Qnt2, A.Isi, A.NoSat, (A.Qnt-isnull(B.Qnt,0)) QntSisa,(A.Qnt2-isnull(B.Qnt2,0)) Qnt2Sisa, d.NFixFrom DBPenyerahanBhnDET A left outer join (Select x.NoPenyerahanBHN,x.UrutPenyerahanBHN, SUM(x.Qnt) Qnt, SUM(x.Qnt2) Qnt2 from DBRPenyerahanBhnDET x left outer join DBRPenyerahanBhn y on y.Nobukti=x.Nobukti Group by x.NoPenyerahanBHN, x.urutPenyerahanBHN) B on B.NoPenyerahanBHN=A.Nobukti and B.urutPenyerahanBHN=A.urut left outer join DBPenyerahanBhn c on c.Nobukti=A.Nobukti left Outer join DBBARANG d on d.KODEBRG=a.kodebrgwhere Cast(Case when Case when C.IsOtorisasi1=1 then 1 else 0 end+ Case when C.IsOtorisasi2=1 then 1 else 0 end+ Case when C.IsOtorisasi3=1 then 1 else 0 end+ Case when C.IsOtorisasi4=1 then 1 else 0 end+ Case when C.IsOtorisasi5=1 then 1 else 0 end=C.MaxOL then 0 else 1 end As Bit)=0 and ((A.Qnt-isnull(B.Qnt,0)>0) or (A.Qnt2-isnull(B.Qnt2,0)>0)) and A.nobukti='0' and C.IsSampel=:intparam"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242018",
			TargetTable: strPtr("dbBeli"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("KodeSupp"),
			Query: strPtr("select a.NoBukti,a.KodeSupp,NamaCustSupp,Sum(NDPP)NDPP,Sum(NPPN)NPPN,Sum(NNET)NNET from dbBeli a Left Outer Join dbBeliDet b On a.NoBukti=b.noBukti Left Outer join dbCustSupp c On c.KodeCustSupp=a.KodeSupp where a.NoBukti Not in(select NoBeli from dbInvoiceDet) Group by a.NoBukti,a.KodeSupp,NamaCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242019",
			TargetTable: strPtr("vwOutSPK_Pakai"),
			KeyField: strPtr("Urut"),
			LabelField: strPtr("KodeBrg"),
			Query: strPtr("select A.Urut, A.KodeBrg, Br.NamaBrg, 1 NFix, A.NoSat, case when A.NoSat=1 then Br.Sat1 else Br.Sat2 end Satuan, A.QntSPK, A.QntPakai, A.QntSisa from vwOutSPK_Pakai A left outer join dbBarang Br on Br.KodeBrg=A.KodeBrg where (A.NoBukti='0') --and A.QntSisa>0 order by A.Urut"),
			IsActive: 1,
		},

		{
			KodeBrowse: "242020",
			TargetTable: strPtr("DBPenyerahanBhnDET"),
			KeyField: strPtr("Nobukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select A.Nobukti, C.Tanggal , NospkFrom DBPenyerahanBhnDET A left outer join (Select x.NoPenyerahanBHN, SUM(x.Qnt) Qnt, SUM(x.Qnt2) Qnt2 from DBRPenyerahanBhnDET x left outer join DBRPenyerahanBhn y on y.Nobukti=x.Nobukti Group by x.NoPenyerahanBHN) B on B.NoPenyerahanBHN=A.Nobukti left outer join DBPenyerahanBhn c on c.Nobukti=A.Nobuktiwhere Cast(Case when Case when C.IsOtorisasi1=1 then 1 else 0 end+ Case when C.IsOtorisasi2=1 then 1 else 0 end+ Case when C.IsOtorisasi3=1 then 1 else 0 end+ Case when C.IsOtorisasi4=1 then 1 else 0 end+ Case when C.IsOtorisasi5=1 then 1 else 0 end=C.MaxOL then 0 else 1 end As Bit)=0 and flagtipe=1 and ((A.Qnt-isnull(B.Qnt,0)>0) or (A.Qnt2-isnull(B.Qnt2,0)>0)) and C.IsSampel=:intparam"),
			IsActive: 1,
		},

		{
			KodeBrowse: "243010",
			TargetTable: strPtr("vwOutBPPB"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Tanggal"),
			Query: strPtr("Select A.NoBukti, A.Tanggal, A.KodeGdgT, A.KDDep, Dp.NmDep from vwOutBPPB A0 left outer join dbBPPB A on A.NoBukti=A0.NoBukti left outer join DBDEPART Dp on Dp.KDDEP=A.KDDEP where A0.QntSisa>0 and a.isotorisasi1=1 group by A.NoBukti, A.Tanggal, A.KodeGdg, A.KDDep, Dp.NmDep order by A.Tanggal, A.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "243011",
			TargetTable: strPtr("vwOutBPPB"),
			KeyField: strPtr("Urut"),
			LabelField: strPtr("KodeBrg"),
			Query: strPtr("select A.Urut, A.KodeBrg, Br.NamaBrg, Br.NFix, A.NoSat, case when A.NoSat=1 then Br.Sat1 else Br.Sat2 end Satuan, case when A.NoSat=1 then A.Qnt else A.Qnt2 End Qnt, case when A.NoSat=1 then A.QntBPPBT else A.Qnt2BPPBT End QntBPPBT, case when A.NoSat=1 then A.QntSisa else A.Qnt2Sisa End QntSisa from vwOutBPPB A left outer join dbBarang Br on Br.KodeBrg=A.KodeBrg where A.NoBukti='0' and A.QntSisa>0 order by A.Urut"),
			IsActive: 1,
		},

		{
			KodeBrowse: "243012",
			TargetTable: strPtr("vwOutSPK_Pakai"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("namabrg"),
			Query: strPtr("Select A0.KodeBrg,namabrg, a0.QntSPK,a0.QntPakai,a0.QntSisa, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from vwOutSPK_Pakai A0 left outer join dbSPK A on A.NoBukti=A0.NoBukti left outer join dbbarang c on c.kodebrg=a0.kodebrg left Outer Join (select a.KodeGdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where /*A0.QntSisa>0 and*/ a0.nobukti = '0' group by A.NoBukti, A.Tanggal, A0.Kodebrg,namabrg,b.Qnt,b.Qnt2 ,a0.QntSPK,a0.QntPakai,a0.QntSisa order by A.Tanggal, A.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "251050",
			TargetTable: strPtr("DbTipeTrans"),
			KeyField: strPtr("Kodetipe"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select Kodetipe,Nama from DbTipeTrans order by Kodetipe"),
			IsActive: 1,
		},

		{
			KodeBrowse: "252014",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select Isnull(NFix,0)Nfix,Isi2,A.KodeBrg,kodebhn,A.Sat1,A.Sat2, A.NamaBrg, 0 QntSaldo, 0 Qnt2Saldo,0 sisaambil from dbBarang A left Outer Join (select a.KodeGdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where A.KodeGrp in (''BLL'')"),
			IsActive: 1,
		},

		{
			KodeBrowse: "500101",
			TargetTable: strPtr("dbPesanTunai"),
			KeyField: strPtr("NOBUKTI"),
			LabelField: strPtr("TANGGAL"),
			Query: strPtr("select A.NOBUKTI, A.TANGGAL from dbPesanTunai A left outer join dbPesanTunaiDet B on B.NOBUKTI = A.NOBUKTI where B.NoSPK = '''' group by A.NOBUKTI, A.TANGGAL"),
			IsActive: 1,
		},

		{
			KodeBrowse: "500102",
			TargetTable: strPtr("dbPesanTunaiDet"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("NAMABRG"),
			Query: strPtr("select A.KodeBrg, B.NAMABRG from dbPesanTunaiDet A left outer join DBBARANG B on B.KODEBRG = A.KodeBrg where A.NoSPK = '''' group by A.KodeBrg, B.NAMABRG"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1014121",
			TargetTable: strPtr("dbo"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("noso"),
			Query: strPtr("Declare @tglhpd datetime set @tglhpd =0 select y.NoBukti,noso,case when BrgJ like ''PBJ.Proff%'' then ''PBJ.Proff'' else BrgJ end brgj,NamaBrgJ,QntJ,NosatJ,IsiJ,SatJ,QntH,SisaSPK,tglselesai,namacustsupp,qntcetak from ( Select A.NoBukti,A.noso,A.KodeBrg BrgJ,E.NamaBrg + '' '' + a.namacustsupp NamaBrgJ ,A.Qnt QntJ,A.Nosat NosatJ,A.Isi IsiJ,A.Satuan SatJ, ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) QntH, A.QNT- ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) SisaSPK,a1.tglselesai,namacustsupp,qntcetak From dbo.cekhpd2(@tglhpd) a1 left outer join [vwSPK] A on a.nobukti=a1.nospk Left Outer join dbBarang E on E.KodeBrg=A.Kodebrg Left Outer join (Select y.isclosespk,y.NoSPK,y.KODEBRG, y.KodeGdg ,Sum( y.QNT*y.ISI)QntHasilPrd from DBHASILPRD x left Outer join DBHASILPRDDET y on y.NOBUKTI=x.NOBUKTI Group by y.NoSPK,y.KODEBRG, y.KodeGdg,isclosespk) B on B.NoSPK=A.NOBUKTI and B.KODEBRG=A.KODEBRG where isnull(isclosespk,0)=0 /*and @tglhpd<=dbo.cekhpd(NOBUKTI ) */ /*and @tglhpd<=case when dbo.cekhpd(NOBUKTI ) =''1900-01-31 2300.000'' then ''2100-1-1'' else dbo.cekhpd(NOBUKTI ) end and a.qnt - ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0)>0*/ union Select A.NoBukti,A.noso,A.KodeBrg BrgJ,E.NamaBrg + '' '' + a.namacustsupp NamaBrgJ ,A.Qnt QntJ,A.Nosat NosatJ,A.Isi IsiJ,A.Satuan SatJ, ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) QntH, A.QNT- ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0) SisaSPK, a1.tglselesai,namacustsupp,qntcetak From dbo.cekhpd2(@tglhpd) a1 left outer join [vwSPK] A on a.nobukti =a1.nospk Left Outer join dbBarang E on E.KodeBrg=A.Kodebrg Left Outer join ( Select y.isclosespk,y.NoSPK,y.KODEBRG, y.KodeGdg ,Sum( y.QNT*y.ISI)QntHasilPrd from DBHASILPRD x left Outer join DBHASILPRDDET y on y.NOBUKTI=x.NOBUKTI Group by y.NoSPK,y.KODEBRG, y.KodeGdg,isclosespk) B on B.NoSPK=A.NOBUKTI and B.KODEBRG=A.KODEBRG where A.QNT- ISNULL(Case when A.Nosat=1 then B.QntHasilPrd when A.Nosat=2 then B.QntHasilPrd/A.isi else 0 end,0 )>0 and b.isclosespk=0 ) y left outer join DBSODET x on x.NOBUKTI =y.noso and x.KODEBRG =y.BrgJ where isnull(x.IsCloseDet,0) =0 Order by y.NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1014122",
			TargetTable: strPtr("dbso"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("BrgJ"),
			Query: strPtr("select e.nobukti NoBukti,b.kodebrg BrgJ,namacustsupp,d.namabrg NamaBrgJ,b.qnt QntJ,e.QntCetak from dbso a left outer join dbsodet b on b.nobukti =a.nobukti left outer join dbcustsupp c on c.kodecustsupp=a.kodecust left outer join dbbarang d on d.kodebrg=b.kodebrg left outer join dbspk e on e.noso =a.nobukti where year (a.tanggal)>=2022 and a.nobukti not like ''%proff%'' and e.nobukti not in (select nospk from dbfinishingdet) order by e.nobukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1100112",
			TargetTable: strPtr("dbGroup"),
			KeyField: strPtr("KodeGrp"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select KodeGrp,Nama from dbGroup where KodeGrp Not in(''BJ'',''BU'') order by KodeGrp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1100411",
			TargetTable: strPtr("dbBIAYA"),
			KeyField: strPtr("KodeBiaya"),
			LabelField: strPtr("Keterangan"),
			Query: strPtr("select KodeBiaya,Keterangan,Perkiraan from dbBIAYA order by KodeBiaya"),
			IsActive: 1,
		},

		{
			KodeBrowse: "1100919",
			TargetTable: strPtr("dbGudang"),
			KeyField: strPtr("*"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select * from dbGudang order by KodeGdg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420111",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select Isnull(NFix,0)Nfix,A.Isi2,A.KodeBrg,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A left Outer Join (select Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where Bulan= and Tahun= group by kodebrg)b On b.kodebrg=a.KodeBrg where a.isAktif=1 and A.KodeGrp=''BJP'' and (a.KodeBrg like ''%0%'' or a.NamaBrg like ''%0%'') order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420112",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select distinct Isnull(NFix,0)Nfix,A.Isi2,A.KodeBrg,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A Left Outer Join DbKOreksidet M1 on A.kodebrg = M1.kodebrg left Outer Join (select a.Kodegdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.Kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where a.isAktif=1 and ( A.KodeGrp<>''BJP'') and (a.KodeBrg like ''%0%'' or a.NamaBrg like ''%0%'') --and M1.Nobukti <>0 order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420113",
			TargetTable: strPtr("dbPesanTunaiDet"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Urut"),
			Query: strPtr("select X.NoBukti, X.Urut, X.KodeBrg, B.NAMABRG,SUM(X.Qnt) Sisa from ( select A.NOBUKTI NoBukti, A.URUT Urut, A.KodeBrg, A.QNT Qnt from dbPesanTunaiDet A union all select A.NOBUKTIORDER, A.URUTORDER, B.KODEBRG,-A.QTY from DBSPKORDER A left outer join DBSPKBJDET B on B.NOBUKTI = A.NOBUKTI and B.URUT = A.URUTSPK ) X left outer join DBBARANG B on B.KODEBRG = X.KodeBrg where X.KodeBrg = 0 group by X.NoBukti, X.Urut, X.KodeBrg, B.NAMABRG order by X.NOBUKTI, X.URUT"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420114",
			TargetTable: strPtr("vwBrowsOutSO_SPP"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("Nama"),
			Query: strPtr("select NoBukti from vwBrowsOutSO_SPP where KodeBrg = 0 group by NoBukti order by NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420115",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select distinct Isnull(NFix,0)Nfix,A.Isi2,A.KodeBrg,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A Left Outer Join DbKOreksidet M1 on A.kodebrg = M1.kodebrg left Outer Join (select a.Kodegdg,Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where a.Kodegdg='0' and Bulan= and Tahun= group by a.Kodegdg,kodebrg)b On b.kodebrg=a.KodeBrg where a.isAktif=1 and ( A.KodeGrp=''BJP'') and (a.KodeBrg like ''%0%'' or a.NamaBrg like ''%0%'') --and M1.Nobukti <>0 order by A.KodeBrg"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420121",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("KodeBrg"),
			LabelField: strPtr("kodebhn"),
			Query: strPtr("Select A.KodeBrg,a.kodebhn, A.NamaBrg,Isnull(Proses,0)IsJasa,perkpers from dbBarang A left outer join DBSubGroupJnsTambah b on b.KodeGrp= a.KODEGRP and b.KodeSubGrp=a.KODESUBGRP left outer join dbsubgroup c on c.kodegrp = a.KODEGRP and c.KodeSubGrp=a.KODESUBGRP where a.isAktif=1 and ( b.Keterangan like ''%0%'' )"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420181",
			TargetTable: strPtr("dbPO"),
			KeyField: strPtr("NOBukti"),
			LabelField: strPtr("KodeVls"),
			Query: strPtr("select NOBukti,a.KodeVls,Kurs,a.PPN,TipeBayar,a.Hari from dbPO a left outer join DBCUSTSUPP b on b.KODECUSTSUPP=a.KODESUPP where KodeSupp='0' /*and NoBukti Not In(Select Isnull(NoPO,'''') from dbInvoice)*/ and isotorisasi1=1 and b.PPN =1 order by NoBukti"),
			IsActive: 1,
		},

		{
			KodeBrowse: "2420182",
			TargetTable: strPtr("dbInvoicePL"),
			KeyField: strPtr("NoBukti"),
			LabelField: strPtr("KodeSupp"),
			Query: strPtr("select a.NoBukti,a.KodeSupp,NamaCustSupp,Sum(NDPP)NDPP,Sum(NPPN)NPPN,Sum(NNET)NNET from dbInvoicePL a Left Outer Join dbInvoicePLDet b On a.NoBukti=b.noBukti Left Outer join dbCustSupp c On c.KodeCustSupp=a.KodeSupp Group by a.NoBukti,a.KodeSupp,NamaCustSupp"),
			IsActive: 1,
		},

		{
			KodeBrowse: "24201122",
			TargetTable: strPtr("dbBarang"),
			KeyField: strPtr("Isnull(NFix"),
			LabelField: strPtr("0)Nfix"),
			Query: strPtr("Select Isnull(NFix,0)Nfix,A.Isi2,A.KodeBrg,A.Sat1,A.Sat2, A.NamaBrg, Isnull(b.Qnt,0) QntSaldo, Isnull(b.Qnt2,0) Qnt2Saldo from dbBarang A left Outer Join (select Kodebrg,Sum(SaldoQnt)Qnt,Sum(Saldo2Qnt)Qnt2 from DBStockBrg a Left Outer Join dbGudang b On a.KodeGdg=b.KodeGdg where Bulan= and Tahun= group by kodebrg)b On b.kodebrg=a.KodeBrg where a.isAktif=1 and A.KodeGrp<>''BJP'' and (a.KodeBrg like ''%0%'' or a.NamaBrg like ''%0%'') order by A.KodeBrg"),
			IsActive: 1,
		},
	}

	for _, cfg := range browseConfigs {
		if err := db.Create(&cfg).Error; err != nil {
			log.Printf("Failed to seed browse config %s: %v", cfg.KodeBrowse, err)
		}
	}

	log.Println("dbbrowseconfigs seeding completed")
}

func strPtr(s string) *string { return &s }