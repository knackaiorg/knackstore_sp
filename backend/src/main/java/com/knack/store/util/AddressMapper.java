package com.knack.store.util;

import com.knack.store.dto.AddressDTO;
import com.knack.store.dto.CustomerAddressDTO;
import com.knack.store.model.Address;
import com.knack.store.model.CustomerAddress;

/**
 * Address <-> AddressDTO mapping.
 *
 * Architect review fix: this exact field-for-field mapping existed twice --
 * OrderService#toAddress/#toAddressDTO and CustomerService#toAddress/#toAddressDTO
 * -- so adding a new Address field meant remembering to update both. The two
 * copies had also already drifted slightly: OrderService's toAddress
 * null-guarded its input, CustomerService's did not (harmless today because
 * both call sites happen to guard with a null check first, but that's exactly
 * the kind of implicit assumption that breaks the next time someone adds a
 * new call site). Both directions are null-safe here.
 */
public final class AddressMapper {

    private AddressMapper() {
    }

    public static Address toAddress(AddressDTO dto) {
        if (dto == null) return null;
        return Address.builder()
                .firstName(dto.getFirstName()).lastName(dto.getLastName())
                .line1(dto.getLine1()).line2(dto.getLine2())
                .city(dto.getCity()).state(dto.getState())
                .postcode(dto.getPostcode()).country(dto.getCountry())
                .phone(dto.getPhone()).build();
    }

    public static AddressDTO toAddressDTO(Address a) {
        if (a == null) return null;
        AddressDTO dto = new AddressDTO();
        dto.setFirstName(a.getFirstName()); dto.setLastName(a.getLastName());
        dto.setLine1(a.getLine1()); dto.setLine2(a.getLine2());
        dto.setCity(a.getCity()); dto.setState(a.getState());
        dto.setPostcode(a.getPostcode()); dto.setCountry(a.getCountry());
        dto.setPhone(a.getPhone());
        return dto;
    }

    /**
     * Multi-Address Book: builds the embedded Address value copied into a
     * CustomerAddress row. Kept as a plain field-for-field copy here too --
     * see the class javadoc on why this mapping only lives in one place.
     */
    public static Address toAddressFromSaveRequest(CustomerAddressDTO.SaveAddressRequest req) {
        if (req == null) return null;
        return Address.builder()
                .firstName(req.getFirstName()).lastName(req.getLastName())
                .line1(req.getLine1()).line2(req.getLine2())
                .city(req.getCity()).state(req.getState())
                .postcode(req.getPostcode()).country(req.getCountry())
                .phone(req.getPhone()).build();
    }

    public static CustomerAddressDTO toCustomerAddressDTO(CustomerAddress ca) {
        if (ca == null) return null;
        Address a = ca.getAddress();
        CustomerAddressDTO dto = new CustomerAddressDTO();
        dto.setId(ca.getId());
        dto.setFirstName(a.getFirstName()); dto.setLastName(a.getLastName());
        dto.setLine1(a.getLine1()); dto.setLine2(a.getLine2());
        dto.setCity(a.getCity()); dto.setState(a.getState());
        dto.setPostcode(a.getPostcode()); dto.setCountry(a.getCountry());
        dto.setPhone(a.getPhone());
        dto.setDefaultAddress(ca.isDefaultAddress());
        return dto;
    }
}
