const getCommoditiesForVendorQuery = `
select c.*
from commodities c
join vendor_commodity vc on c.id = vc.commodity_id
where vc.vendor_id = $1
`

const getVendorsForCommodityQuery = `
select v.*
from vendors v
join vendor_commodity vc on v.id = vc.vendor_id
where vc.commodity_id = $1
`

const getVendorSuggestionForCommodityQuery = `
select v.id, v.name, v.phone_number,
    coalesce(sum(b.total_amount - b.paid_amount), 0) as pending_amount
from vendor_commodity vc
join vendors v on vc.vendor_id = v.id
left join bills b on b.vendor_id = v.id and b.user_id = $2 and b.status != 'paid'
where vc.commodity_id = $1 and v.user_id = $2
group by v.id, v.name, v.phone_number
order by pending_amount asc
`

const linkCommodityToVendorQuery = `
insert into vendor_commodity(vendor_id, commodity_id)
values($1, $2)
`

const unlinkCommodityFromVendorQuery = `
delete from vendor_commodity
where vendor_id = $1 and commodity_id = $2
`

module.exports = {
    getCommoditiesForVendorQuery,
    getVendorsForCommodityQuery,
    getVendorSuggestionForCommodityQuery,
    linkCommodityToVendorQuery,
    unlinkCommodityFromVendorQuery
}
