package com.knack.store.service;

import com.knack.store.dto.AddressDTO;
import com.knack.store.dto.AuthDTO;
import com.knack.store.dto.CustomerDTO;
import com.knack.store.model.Address;
import com.knack.store.model.Cart;
import com.knack.store.model.Customer;
import com.knack.store.model.UserRole;
import com.knack.store.repository.AddressRepository;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        return registerWithRole(request, UserRole.CUSTOMER);
    }

    public AuthDTO.AuthResponse registerStaff(AuthDTO.RegisterRequest request) {
        return registerWithRole(request, UserRole.STAFF);
    }

    private AuthDTO.AuthResponse registerWithRole(AuthDTO.RegisterRequest request, UserRole role) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        Customer customer = Customer.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(role)
                .build();
        customerRepository.save(customer);

        Cart cart = Cart.builder().customer(customer).build();
        cartRepository.save(cart);

        String token = jwtUtil.generateToken(customer.getEmail());
        AuthDTO.AuthResponse response = new AuthDTO.AuthResponse(
                customer.getId(),
                token,
                customer.getEmail(),
                customer.getFirstName(),
                customer.getLastName()
        );
        response.setRole(customer.getRole().name());
        return response;
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        Customer customer = customerRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        String token = jwtUtil.generateToken(customer.getEmail());
        AuthDTO.AuthResponse response = new AuthDTO.AuthResponse(
                customer.getId(),
                token,
                customer.getEmail(),
                customer.getFirstName(),
                customer.getLastName()
        );
        response.setRole(customer.getRole() != null ? customer.getRole().name() : UserRole.CUSTOMER.name());
        return response;
    }

    public CustomerDTO getProfile(String email) {
        Customer c = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return toDTO(c);
    }

    public CustomerDTO updateProfile(String email, CustomerDTO.UpdateProfileRequest request) {
        Customer c = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        if (request.getFirstName() != null) c.setFirstName(request.getFirstName());
        if (request.getLastName() != null) c.setLastName(request.getLastName());
        if (request.getPhone() != null) c.setPhone(request.getPhone());
        customerRepository.save(c);
        return toDTO(c);
    }

    public CustomerDTO createAddress(String email, CustomerDTO.CreateAddressRequest request) {
        Customer c = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Address address = Address.builder()
                .customer(c)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .postcode(request.getPostcode())
                .country(request.getCountry())
                .phone(request.getPhone())
                .build();
        addressRepository.save(address);
        return toDTO(c);
    }

    public CustomerDTO deleteAddress(String email, Long addressId) {
        Customer c = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Address address = addressRepository.findByIdAndCustomerId(addressId, c.getId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        addressRepository.delete(address);
        return toDTO(c);
    }

    public AddressDTO getAddress(String email, Long addressId) {
        Customer c = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Address address = addressRepository.findByIdAndCustomerId(addressId, c.getId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        return toAddressDTO(address);
    }

    private CustomerDTO toDTO(Customer c) {
        return CustomerDTO.builder()
                .id(c.getId())
                .email(c.getEmail())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .phone(c.getPhone())
                .build();
    }


    private AddressDTO toAddressDTO(Address a) {
        AddressDTO dto = new AddressDTO();
        dto.setId(a.getId());
        dto.setFirstName(a.getFirstName()); dto.setLastName(a.getLastName());
        dto.setLine1(a.getLine1()); dto.setLine2(a.getLine2());
        dto.setCity(a.getCity()); dto.setState(a.getState());
        dto.setPostcode(a.getPostcode()); dto.setCountry(a.getCountry());
        dto.setPhone(a.getPhone());
        return dto;
    }
}
